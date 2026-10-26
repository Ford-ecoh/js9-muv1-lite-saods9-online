/*jslint white: true, vars: true, plusplus: true, nomen: true, unparam: true */
/*globals $, JS9, require */ 

"use strict";


(function() {
    var imexam = require("./imexam");

    var photometrySettings = {};

    function format(value, digits) {
        return Number.isFinite(value) ? value.toFixed(digits) : "—";
    }

    function metrics(items) {
        return items.map(function(item) {
            return "<div class='JS9RegionStatsMetric'><span>" + item[0] + "</span><strong>" + item[1] + "</strong>" + (item[2] ? "<small>" + item[2] + "</small>" : "") + "</div>";
        }).join("");
    }

    function settingsFor(im) {
        var key = im.display.id;
        photometrySettings[key] = photometrySettings[key] || {zeroPoint: 0, exposure: 1};
        return photometrySettings[key];
    }

    function updateSettings(im, requested) {
        var settings = settingsFor(im);
        if( requested && Number.isFinite(Number(requested.zeroPoint)) ) { settings.zeroPoint = Number(requested.zeroPoint); }
        if( requested && Number.isFinite(Number(requested.exposure)) && Number(requested.exposure) > 0 ) { settings.exposure = Number(requested.exposure); }
        return settings;
    }

    // Use the geometric mean for a single circular pixel scale. This avoids
    // favoring either axis when WCS pixels are slightly non-square.
    function arcsecPerPixel(im) {
        var wcsinfo = im && im.raw && im.raw.wcsinfo;
        var xscale = wcsinfo && Math.abs(Number(wcsinfo.cdelt1));
        var yscale = wcsinfo && Math.abs(Number(wcsinfo.cdelt2));
        if( Number.isFinite(xscale) && Number.isFinite(yscale) && xscale > 0 && yscale > 0 ) {
            return Math.sqrt(xscale * yscale) * 3600;
        }
        return null;
    }

    function pixelMeasurement(value, scale, digits) {
        var pixels = format(value, digits);
        return scale ? pixels + " px · " + format(value * scale, digits) + "″" : pixels + " px";
    }

    function median(values) {
        var sorted = values.slice().sort(function(a, b) { return a - b; });
        var middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }

    function robustBackground(values) {
        var sample = values.filter(function(value) { return Number.isFinite(value); });
        var iteration, center, deviations, mad, sigma, clipped, mean, variance;

        if( !sample.length ) {
            return {value: 0, noise: 0, pixels: 0};
        }
        for (iteration = 0; iteration < 3 && sample.length > 3; iteration++) {
            center = median(sample);
            deviations = sample.map(function(value) { return Math.abs(value - center); });
            mad = median(deviations);
            sigma = 1.4826 * mad;
            if( !Number.isFinite(sigma) || sigma === 0 ) { break; }
            clipped = sample.filter(function(value) { return Math.abs(value - center) <= 3 * sigma; });
            if( clipped.length === sample.length || !clipped.length ) { break; }
            sample = clipped;
        }
        center = median(sample);
        mean = sample.reduce(function(total, value) { return total + value; }, 0) / sample.length;
        variance = sample.reduce(function(total, value) { return total + Math.pow(value - mean, 2); }, 0);
        return {value: center, noise: sample.length > 1 ? Math.sqrt(variance / (sample.length - 1)) : 0, pixels: sample.length};
    }

    function radialFWHM(pixels, centerX, centerY, apertureRadius) {
        var binWidth = 0.25, bins = [], peak = -Infinity, peakBin = 0, i, bin, profile, half, previous, previousBin;
        pixels.forEach(function(pixel) {
            var radius = Math.hypot(pixel.x - centerX, pixel.y - centerY);
            if( radius <= apertureRadius && pixel.value > 0 ) {
                bin = Math.floor(radius / binWidth);
                bins[bin] = bins[bin] || {sum: 0, count: 0};
                bins[bin].sum += pixel.value;
                bins[bin].count++;
            }
        });
        profile = bins.map(function(item) { return item ? item.sum / item.count : NaN; });
        profile.forEach(function(value, index) {
            if( Number.isFinite(value) && value > peak ) { peak = value; peakBin = index; }
        });
        if( !Number.isFinite(peak) || peak <= 0 ) { return -1; }
        half = peak / 2;
        previous = peak;
        previousBin = peakBin;
        for (i = peakBin + 1; i < profile.length; i++) {
            if( !Number.isFinite(profile[i]) ) { continue; }
            if( profile[i] <= half ) {
                // Linear interpolation gives the radial half-maximum crossing.
                if( previous === profile[i] ) { return 2 * (i * binWidth); }
                return 2 * ((previousBin + (i - previousBin) * (previous - half) / (previous - profile[i])) * binWidth);
            }
            previous = profile[i];
            previousBin = i;
        }
        return -1;
    }

    function aperturePhotometry(im, xreg, settings) {
        var radii = (xreg.radii || []).filter(function(radius) { return Number.isFinite(radius) && radius > 0; }).sort(function(a, b) { return a - b; });
        var sourceRadius = radii[0], skyOuterRadius = radii[radii.length - 1];
        var source = [], sky = [], sourceSum = 0, section, data, x, y, value, dx, dy, radius;
        var background, netPixels, weightedSum = 0, weightedX = 0, weightedY = 0, flux, fluxError, centroidX, centroidY, countRate, instrumentalMagnitude, calibratedMagnitude, magnitudeError;

        if( radii.length < 2 || sourceRadius >= skyOuterRadius ) { return null; }
        section = imexam.reg2section(xreg);
        data = imexam.getRegionData(im, xreg);
        for (y = 0; y < data.shape[0]; y++) {
            for (x = 0; x < data.shape[1]; x++) {
                value = data.get(y, x);
                if( !Number.isFinite(value) ) { continue; }
                dx = section[0][0] + x - xreg.x;
                dy = section[1][0] + y - xreg.y;
                radius = Math.hypot(dx, dy);
                if( radius <= sourceRadius ) {
                    source.push({x: section[0][0] + x, y: section[1][0] + y, value: value});
                    sourceSum += value;
                } else if( radius <= skyOuterRadius ) {
                    sky.push(value);
                }
            }
        }
        background = robustBackground(sky);
        netPixels = source.map(function(pixel) {
            return {x: pixel.x, y: pixel.y, value: pixel.value - background.value};
        });
        netPixels.forEach(function(pixel) {
            // Negative background-subtracted values do not define a source centroid.
            if( pixel.value > 0 ) {
                weightedSum += pixel.value;
                weightedX += pixel.x * pixel.value;
                weightedY += pixel.y * pixel.value;
            }
        });
        flux = sourceSum - background.value * source.length;
        // The input data are assumed to be in electrons (gain = 1). The second
        // term includes both per-aperture sky noise and finite-sky uncertainty.
        fluxError = Math.sqrt(Math.max(sourceSum, 0) + source.length * Math.pow(background.noise, 2) * (1 + source.length / Math.max(background.pixels, 1)));
        centroidX = weightedSum ? weightedX / weightedSum : xreg.x;
        centroidY = weightedSum ? weightedY / weightedSum : xreg.y;
        settings = settings || {zeroPoint: 0, exposure: 1};
        countRate = flux > 0 && settings.exposure > 0 ? flux / settings.exposure : NaN;
        instrumentalMagnitude = countRate > 0 ? -2.5 * Math.log10(countRate) : NaN;
        calibratedMagnitude = Number.isFinite(instrumentalMagnitude) ? instrumentalMagnitude + settings.zeroPoint : NaN;
        magnitudeError = flux > 0 && fluxError > 0 ? 1.0857362047581294 * fluxError / flux : NaN;
        return {sourceRadius: sourceRadius, skyOuterRadius: skyOuterRadius, sourcePixels: source.length, skyPixels: background.pixels, rawCounts: sourceSum, background: background.value, backgroundNoise: background.noise, flux: flux, fluxError: fluxError, snr: fluxError ? flux / fluxError : 0, centroidX: centroidX, centroidY: centroidY, fwhm: radialFWHM(netPixels, centroidX, centroidY, sourceRadius), pixelScale: arcsecPerPixel(im), exposure: settings.exposure, zeroPoint: settings.zeroPoint, countRate: countRate, instrumentalMagnitude: instrumentalMagnitude, calibratedMagnitude: calibratedMagnitude, magnitudeError: magnitudeError};
    }

    function regionStats(im, xreg){
        var section = imexam.reg2section(xreg);
	var imag    = imexam.getRegionData(im, xreg);

        var data    = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);
        var data2   = imexam.ndops.assign(imexam.ndops.zeros(imag.shape), imag);

        var stats   = {};

	if( !im || !xreg ){
	    return null;
	}

        stats.reg = xreg;
        stats.min = imexam.ndops.minvalue(imag);
        stats.max = imexam.ndops.maxvalue(imag);
        stats.bkgd  = imexam.imops.backgr(imag, 4);

	// background-subtracted data
        imexam.ndops.subs(data, imag, stats.bkgd.value);
        stats.bscnts = imexam.ndops.centroid(data, imexam.ndops.qcenter(data));
        stats.bscnts.cenx += section[0][0];
        stats.bscnts.ceny += section[1][0];

	// total counts
        stats.totcnts = imexam.ndops.centroid(data2, imexam.ndops.qcenter(data2));
        stats.totcnts.cenx += section[0][0];
        stats.totcnts.ceny += section[1][0];

	return stats;
    }

    function renderQuickStats(div, im, xreg) {
        var stats = regionStats(im, xreg);
        var scale = arcsecPerPixel(im);
        $(div).html("<section class='JS9RegionStats JS9RegionStatsQuick'><header><div><span class='JS9RegionStatsEyebrow'>QUICK STATISTICS</span><h3>Region Pixel Statistics</h3></div><span class='JS9RegionStatsBadge'>" + xreg.shape + "</span></header><div class='JS9RegionStatsGrid'>" + metrics([
            ["Minimum", format(stats.min, 2)], ["Maximum", format(stats.max, 2)],
            ["Total counts", format(stats.totcnts.sum, 2)], ["Background-subtracted", format(stats.bscnts.sum, 2)],
            ["Background / pixel", format(stats.bkgd.value, 3)], ["Background RMS", format(stats.bkgd.noise, 3)],
            ["Centroid", format(stats.bscnts.cenx, 2) + ", " + format(stats.bscnts.ceny, 2)], ["Moment FWHM", pixelMeasurement(stats.bscnts.fwhm, scale, 2)],
            ["Pixel scale", scale ? format(scale, 4) + " arcsec / px" : "No WCS"]
        ]) + "</div><p class='JS9RegionStatsHint'>Quick statistics do not use a sky annulus and do not report magnitudes or photometric errors.</p></section>");
    }

    function renderPhotometry(div, im, xreg) {
        var settings = settingsFor(im);
        var photometry = aperturePhotometry(im, xreg, settings);
        if( !photometry ) {
            $(div).html("<section class='JS9RegionStats'><p class='JS9RegionStatsHint'>Use an annular Region with at least two radii: the inner circle is the source aperture and the outer circle defines the sky boundary.</p></section>");
            return;
        }
        $(div).html("<section class='JS9RegionStats JS9RegionStatsScience'><header><div><span class='JS9RegionStatsEyebrow'>SCIENTIFIC PHOTOMETRY</span><h3>Annular Aperture Photometry</h3></div><span class='JS9RegionStatsBadge'>ANNULUS</span></header><p class='JS9RegionStatsHint'>Inner circle: source aperture. Outer circle: sky boundary. Background uses robust MAD 3σ clipping.</p><div class='JS9RegionStatsGrid'>" + metrics([
            ["Net flux", format(photometry.flux, 3), "counts"], ["Flux error", format(photometry.fluxError, 3), "counts"],
            ["S/N", format(photometry.snr, 2)], ["FWHM", pixelMeasurement(photometry.fwhm, photometry.pixelScale, 3)],
            ["Background / pixel", format(photometry.background, 4)], ["Background RMS", format(photometry.backgroundNoise, 4)],
            ["Raw counts", format(photometry.rawCounts, 3), "counts"], ["Source / sky pixels", photometry.sourcePixels + " / " + photometry.skyPixels],
            ["Source radius", pixelMeasurement(photometry.sourceRadius, photometry.pixelScale, 2)], ["Sky outer radius", pixelMeasurement(photometry.skyOuterRadius, photometry.pixelScale, 2)],
            ["Centroid", format(photometry.centroidX, 3) + ", " + format(photometry.centroidY, 3)], ["Pixel scale", photometry.pixelScale ? format(photometry.pixelScale, 4) + " arcsec / px" : "No WCS"]
        ]) + "</div><div class='JS9RegionStatsCalibration'><div class='JS9RegionStatsFormTitle'>Magnitude calibration</div><label>Exposure <input name='exposure' type='number' min='0.000001' step='any' value='" + settings.exposure + "'> <span>s</span></label><label>Instrument zero point <input name='zeroPoint' type='number' step='any' value='" + settings.zeroPoint + "'> <span>mag</span></label><button type='button'>Apply calibration</button></div><div class='JS9RegionStatsMagnitude'><div class='JS9RegionStatsMagnitudeRow'>" + metrics([
            ["Instrumental magnitude", format(photometry.instrumentalMagnitude, 4), "mag"], ["Calibrated magnitude", format(photometry.calibratedMagnitude, 4), "mag"], ["Magnitude error", format(photometry.magnitudeError, 4), "mag"]
        ]) + "</div><div class='JS9RegionStatsRate'>Count rate <strong>" + format(photometry.countRate, 4) + "</strong> counts / s</div></div><p class='JS9RegionStatsFormula'>m<sub>inst</sub> = −2.5 log<sub>10</sub>(F / t)，m = m<sub>inst</sub> + ZP</p></section>");
        $(div).find(".JS9RegionStatsCalibration button").on("click", function() {
            var calibration = $(this).closest(".JS9RegionStatsCalibration");
            updateSettings(im, {exposure: calibration.find("[name=exposure]").val(), zeroPoint: calibration.find("[name=zeroPoint]").val()});
            renderPhotometry(div, im, xreg);
        });
    }

    // Reused by the annulus editor's Region Stats tab in js9.js.
    JS9.RegionStats = JS9.RegionStats || {};
    JS9.RegionStats.renderPhotometry = renderPhotometry;

    function statUpdate(im, xreg) {
        var div = this.div;
        if( im && xreg && xreg.shape === "annulus" ) {
            renderPhotometry(div, im, xreg);
        } else {
            renderQuickStats(div, im, xreg);
        }
    }

    function statInit() {
	imexam.fixupDiv(this);
        $(this.div).append("<p style='padding: 20px 0px 0px 20px; margin: 0px'>create, click, move, or resize a region to see stats<br>");
    }

    // add method to JS9 Image object and to public API
    JS9.Image.prototype.getRegionStats = function(xreg){
	return regionStats(this, xreg);
    };
    JS9.mkPublic("GetRegionStats", "getRegionStats");
    JS9.Image.prototype.getAperturePhotometry = function(xreg){
	return xreg && xreg.shape === "annulus" ? aperturePhotometry(this, xreg, settingsFor(this)) : null;
    };
    JS9.mkPublic("GetAperturePhotometry", "getAperturePhotometry");
    JS9.Image.prototype.getPhotometrySettings = function(){ return $.extend({}, settingsFor(this)); };
    JS9.Image.prototype.setPhotometrySettings = function(settings){ return $.extend({}, updateSettings(this, settings)); };
    JS9.mkPublic("GetPhotometrySettings", "getPhotometrySettings");
    JS9.mkPublic("SetPhotometrySettings", "setPhotometrySettings");
    JS9.mkPublic("SetPhotometryZeroPoint", function(...args){
        var obj = JS9.parsePublicArgs(args);
        var im = JS9.getImage(obj.display);
        return im ? $.extend({}, updateSettings(im, {zeroPoint: obj.argv[0]})) : null;
    });

    JS9.RegisterPlugin("ImExam", "RegionStats", statInit, {
	    menu: "analysis",

            winTitle: "Region Stats",
            menuItem: "Region Stats",
	    help:     "imexam/imexam.html#rgstat",

	    dynamicSelect: true,

	toolbarSeparate: true,

            onregionschange: statUpdate,
            winDims: [440, 560],
            winResize: true
    });
}());
