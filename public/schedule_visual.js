(function () {
    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const START_HOUR = 0;
    const END_HOUR = 24;
    const SLOT_MINS = 30;
    const SLOT_HEIGHT = 20;
    const HEADER_HEIGHT = 30;

    function formatHourLabel(h) {
        return (h < 10 ? '0' : '') + h + ':00';
    }

    function timeToMins(str) {
        if (!str) return 0;
        var parts = str.split(':');
        return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }

    function normalizeDays(days) {
        return (days || []).map(function (d) { return String(d).toLowerCase().slice(0, 3); });
    }

    function isSlotBlocked(dayIdx, slotStart, periods) {
        var slotEnd = slotStart + SLOT_MINS;
        var dayKey = DAYS[dayIdx];
        var prevDayKey = DAYS[(dayIdx + 6) % 7];

        for (var i = 0; i < periods.length; i++) {
            var p = periods[i];
            var days = normalizeDays(p.days);
            var from = timeToMins(p.from);
            var to = timeToMins(p.to);

            if (from < to) {
                // Intra-day block (e.g. 09:00 → 17:00)
                if (days.indexOf(dayKey) !== -1 && slotStart < to && slotEnd > from) return true;
            } else if (from > to) {
                // Overnight block (e.g. 22:00 → 07:00)
                if (days.indexOf(dayKey) !== -1 && slotEnd > from) return true;
                if (days.indexOf(prevDayKey) !== -1 && slotStart < to) return true;
            } else {
                // from === to: treat as all-day block
                if (days.indexOf(dayKey) !== -1) return true;
            }
        }
        return false;
    }

    function el(tag, className) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        return e;
    }

    window.renderVisualSchedule = function (periods) {
        var container = document.getElementById('schedule-visual');
        if (!container) return;

        var now = new Date();
        var todayIdx = (now.getDay() + 6) % 7; // 0=Mon…6=Sun
        var nowMins = now.getHours() * 60 + now.getMinutes();

        // Build array of slot start times (minutes from midnight)
        var slots = [];
        for (var h = START_HOUR; h < END_HOUR; h++) {
            slots.push(h * 60);
            slots.push(h * 60 + 30);
        }

        var frag = document.createDocumentFragment();
        var scroll = el('div', 'sv-scroll');
        var grid = el('div', 'sv-grid');

        // ---- Time gutter column ----
        var gutterCol = el('div', 'sv-gutter-col');
        gutterCol.appendChild(el('div', 'sv-gutter-spacer')); // blank spacer matching header height
        for (var si = 0; si < slots.length; si++) {
            var tDiv = el('div', 'sv-time-slot');
            tDiv.style.height = SLOT_HEIGHT + 'px';
            var slotH = Math.floor(slots[si] / 60);
            var slotM = slots[si] % 60;
            if (slotM === 0) tDiv.textContent = formatHourLabel(slotH);
            gutterCol.appendChild(tDiv);
        }
        grid.appendChild(gutterCol);

        // ---- Day columns (header + cells together so border wraps both) ----
        for (var d = 0; d < 7; d++) {
            var isToday = (d === todayIdx);
            var col = el('div', 'sv-day-col-wrap' + (isToday ? ' sv-today-col' : ''));

            var hdr = el('div', 'sv-day-header' + (isToday ? ' sv-today-header' : ''));
            hdr.textContent = DAY_LABELS[d];
            col.appendChild(hdr);

            for (var sj = 0; sj < slots.length; sj++) {
                var blocked = isSlotBlocked(d, slots[sj], periods);
                var cell = el('div', 'sv-slot ' + (blocked ? 'sv-blocked' : 'sv-allowed'));
                cell.style.height = SLOT_HEIGHT + 'px';
                col.appendChild(cell);
            }
            grid.appendChild(col);
        }

        // ---- Current-time indicator ----
        // top = header height + offset into the cells area
        if (nowMins >= START_HOUR * 60 && nowMins < END_HOUR * 60) {
            var topPx = HEADER_HEIGHT + ((nowMins - START_HOUR * 60) / SLOT_MINS) * SLOT_HEIGHT;
            var nowLine = el('div', 'sv-now-line');
            nowLine.style.top = topPx + 'px';
            grid.appendChild(nowLine);
        }

        scroll.appendChild(grid);
        frag.appendChild(scroll);

        // ---- Legend ----
        var legend = el('div', 'sv-legend');
        var off = el('span', 'sv-legend-item');
        off.innerHTML = '<span class="sv-legend-dot sv-legend-off"></span> \u2013 blocked hours';
        var on = el('span', 'sv-legend-item');
        on.innerHTML = '<span class="sv-legend-dot sv-legend-on"></span> \u2013 allowed hours';
        legend.appendChild(off);
        legend.appendChild(on);
        frag.appendChild(legend);

        container.innerHTML = '';
        container.appendChild(frag);
    };
}());
