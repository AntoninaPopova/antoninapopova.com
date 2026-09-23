// ==========================================
// BASIC SETUP
// ==========================================

const width = 1100;
const height = 750;

const svg = d3.select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");


// ==========================================
// MAP GROUP
// Countries and circles are inside the same
// group so they zoom together.
// ==========================================

const mapGroup = svg.append("g");


// ==========================================
// PROJECTION
// ==========================================

const projection = d3.geoNaturalEarth1()
    .scale(195)
    .translate([width / 2, height / 2]);

const path = d3.geoPath()
    .projection(projection);


// ==========================================
// TOOLTIP
// ==========================================

const tooltip = d3.select("#tooltip");


// ==========================================
// LOAD DATA
// ==========================================

Promise.all([

    d3.json(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    ),

    d3.csv("data/places.csv")

])

.then(([world, places]) => {


    // ==========================================
    // PREPARE DATA
    // ==========================================

    places.forEach(d => {

        // Numeric fields

        d.latitude = +d.latitude;
        d.longitude = +d.longitude;
        d.days = +d.days;


        // Text fields

        d.type = (d.type || "")
            .trim()
            .toLowerCase();

        d.life_stage = (d.life_stage || "")
            .trim()
            .toLowerCase();

        d.companion = (d.companion || "")
            .trim()
            .toLowerCase();

        d.date_type = (d.date_type || "")
            .trim()
            .toLowerCase();


        // Chapter variables

        for (let i = 1; i <= 8; i++) {

            d[`chapter_${i}`] =
                (d[`chapter_${i}`] || "0").trim();

        }


        // Keep date fields as strings.
        // They describe the time period but do not
        // determine the bubble size.

        d.year = (d.year || "").trim();
        d.date_apx = (d.date_apx || "").trim();
        d.start_date = (d.start_date || "").trim();
        d.end_date = (d.end_date || "").trim();

    });


    // ==========================================
    // DEBUG INFORMATION
    // ==========================================

    console.log("CSV columns:", places.columns);

    console.log("Number of places:", places.length);

    console.log("First place:", places[0]);

    console.log(
        "Min days:",
        d3.min(places, d => d.days)
    );

    console.log(
        "Max days:",
        d3.max(places, d => d.days)
    );

    console.log(
        "Invalid days:",
        places.filter(d => !Number.isFinite(d.days))
    );

    console.log(
        "Invalid coordinates:",
        places.filter(d =>
            !Number.isFinite(d.latitude) ||
            !Number.isFinite(d.longitude)
        )
    );


    // ==========================================
    // COUNTRIES
    // ==========================================

    const countries = topojson.feature(
        world,
        world.objects.countries
    );


    mapGroup
        .append("g")
        .selectAll("path")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .attr("d", path);


    // ==========================================
    // TIME RANGE
    // ==========================================

    const minDays = d3.min(
        places,
        d => d.days
    );

    const maxDays = d3.max(
        places,
        d => d.days
    );


    // ==========================================
    // TIME SCALE
    // ==========================================

    let currentScale = "log";


    // ==========================================
    // POWER RADIUS
    // ==========================================

    const radiusPower = d3.scalePow()
        .exponent(0.5)
        .domain([minDays, maxDays])
        .range([0.8, 10]);


    // ==========================================
    // LOGARITHMIC RADIUS
    // ==========================================

    const radiusLog = d3.scaleLog()
        .domain([minDays, maxDays])
        .range([0.8, 10]);


    // ==========================================
    // POWER OPACITY
    // ==========================================

    const opacityPower = d3.scalePow()
        .exponent(0.35)
        .domain([minDays, maxDays])
        .range([0.9, 0.18]);


    // ==========================================
    // LOGARITHMIC OPACITY
    // ==========================================

    const opacityLog = d3.scaleLog()
        .domain([minDays, maxDays])
        .range([0.9, 0.18]);


    // ==========================================
    // FUNCTIONS FOR CURRENT SCALE
    // ==========================================

    function getRadius(days) {

        if (currentScale === "power") {
            return radiusPower(days);
        }

        return radiusLog(days);
    }


    function getOpacity(days) {

        if (currentScale === "power") {
            return opacityPower(days);
        }

        return opacityLog(days);
    }


    // ==========================================
    // COMPANION COLOURS
    // ==========================================

    const companionColors = {

        "alone": "#C9ADA7",

        "with family": "#9A8C98",

        "with friends": "#22223B"

    };


    // ==========================================
    // DISPLAY LABELS
    // ==========================================

    const displayLabels = {

        "home": "Home",

        "purpose": "Purpose",

        "leisure": "Leisure",

        "childhood": "Childhood",

        "student": "Student",

        "early career": "Early career",

        "international career": "International career",

        "transition": "Transition",

        "family": "Family",

        "alone": "Alone",

        "with family": "With family",

        "with friends": "With friends"

    };


    function formatLabel(value) {

        return displayLabels[value] || value;

    }


    // ==========================================
    // CHAPTER TITLES
    // ==========================================

    const chapterTitles = {

        1: "Kazan, for a start",

        2: "Learning to live alone",

        3: "The search for somewhere",

        4: "First year abroad",

        5: "Seven years later",

        6: "Maybe this isn’t it",

        7: "A slight detour to Gran Canaria",

        8: "The French experiment"

    };


// ==========================================
// CHAPTER TEXT
// Short editorial text shown when a chapter
// is selected.
// ==========================================

const chapterTexts = {

    1: "I grew up in Kazan, and until about two months before I left, I had never even had a thought that one day I might live somewhere else. It simply wasn’t in my imagination. Then I took one step out, without any particular expectations, and somehow I have been moving ever since.",

    2: "St Petersburg was the beginning of my adult, serious life: learning to solve problems on my own, rely on myself, and slowly understand who I was. It was also a period of complete openness to the world — welcoming almost everything that came my way. I discovered how enormous and different the world was, and apparently decided that discovering it was not something I could easily get tired of.",

    3: "This was a period of trials and errors — sometimes two steps forward, sometimes one step back. A period of gradually removing what I no longer needed from my life, becoming more deliberate about what to leave behind, and starting to search for what I actually wanted rather than simply accepting whatever happened to arrive.",

    4: "At first, I planned to stay for just three months. As they say, nothing is more permanent than temporary. It was a period of building myself from zero, brick by brick, in a completely new context: a new country, another language, an international environment. The first year was less about finding my place than learning how to function in a completely new one.",

    5: "I built a life, but somewhere along the way I also lost myself in cultures. The world stopped being enormous and became something much more tangible, with its own boundaries — boundaries that, at some point, started to feel a little too close.",

    6: "Another period of searching, but a very different kind from the student years. More challenging, more precise. The stakes were higher, and so were the expectations. By then, moving was no longer just about discovering what was out there. It was about deciding what was actually worth building.",

    7: "Gran Canaria was supposed to become something more permanent, but instead became a detour. I didn’t stay long enough for it to become a real chapter, but long enough to start imagining what a different life might look like. And I couldn’t quite stop thinking about what might come next.",

    8: "France became another attempt at building a life somewhere new. A different language, a different rhythm, another version of everyday life. I came here without knowing what it would become — which, perhaps, is exactly what makes it an experiment."

};




    // ==========================================
    // CALCULATE PROJECTED POSITIONS
    // ==========================================

    places.forEach(d => {

        const projected = projection([
            d.longitude,
            d.latitude
        ]);

        d.baseX = projected[0];
        d.baseY = projected[1];

    });


    // ==========================================
    // HANDLE REPEATED LOCATIONS
    // ==========================================

    const locationGroups = d3.group(
        places,
        d => `${d.latitude},${d.longitude}`
    );


    locationGroups.forEach(group => {

        if (group.length <= 1) {
            return;
        }


        const offsetDistance = 2.5;


        group.forEach((d, i) => {

            const angle =
                (2 * Math.PI * i) / group.length;

            d.offsetX =
                Math.cos(angle) * offsetDistance;

            d.offsetY =
                Math.sin(angle) * offsetDistance;

        });

    });


    // ==========================================
    // PLACES GROUP
    // ==========================================

    const placesGroup = mapGroup
        .append("g")
        .attr("class", "places");


    // ==========================================
    // PLACE CIRCLES
    // ==========================================

    const placeCircles = placesGroup
        .selectAll(".place")
        .data(places)
        .join("circle")

        .attr("class", "place")


        // ==========================================
        // POSITION
        // ==========================================

        .attr("cx", d => {

            return d.baseX + (d.offsetX || 0);

        })

        .attr("cy", d => {

            return d.baseY + (d.offsetY || 0);

        })


        // ==========================================
        // SIZE
        // ==========================================

        .attr("r", d => {

            return getRadius(d.days);

        })


        // ==========================================
        // COLOUR
        // ==========================================

        .attr("fill", d => {

            return companionColors[d.companion]
                || "#22223B";

        })


        // ==========================================
        // TRANSPARENCY
        // ==========================================

        .attr("fill-opacity", d => {

            return getOpacity(d.days);

        })


        // ==========================================
        // TOOLTIP
        // ==========================================

        .on("mouseenter", function(event, d) {

            tooltip
                .style("display", "block")

                .html(`

                    <div class="tooltip-place">

                        ${d.city}, ${d.country}

                        ${d.year

                            ? `<span class="tooltip-date"> · ${d.year}</span>`

                            : ""

                        }

                    </div>

                    <div class="tooltip-story">

                        ${d.tooltip || ""}

                    </div>

                    <div class="tooltip-meta">

                        ${d.days.toLocaleString()} days

                        · ${d.type}

                        · ${d.companion}

                    </div>

                `);

        })


        .on("mousemove", function(event) {

            const tooltipNode = tooltip.node();

            const tooltipWidth =
                tooltipNode.offsetWidth;

            const tooltipHeight =
                tooltipNode.offsetHeight;


            const margin = 10;
            const offset = 15;


            let left =
                event.clientX + offset;

            let top =
                event.clientY + offset;


            // ==========================================
            // HORIZONTAL POSITION
            // ==========================================

            if (
                left + tooltipWidth >
                window.innerWidth - margin
            ) {

                left =
                    event.clientX -
                    tooltipWidth -
                    offset;

            }


            if (left < margin) {

                left = margin;

            }


            if (
                left + tooltipWidth >
                window.innerWidth - margin
            ) {

                left =
                    window.innerWidth -
                    tooltipWidth -
                    margin;

            }


            // ==========================================
            // VERTICAL POSITION
            // ==========================================

            if (
                top + tooltipHeight >
                window.innerHeight - margin
            ) {

                top =
                    event.clientY -
                    tooltipHeight -
                    offset;

            }


            if (top < margin) {

                top = margin;

            }


            if (
                top + tooltipHeight >
                window.innerHeight - margin
            ) {

                top =
                    window.innerHeight -
                    tooltipHeight -
                    margin;

            }


            // ==========================================
            // APPLY POSITION
            // ==========================================

            tooltip
                .style("left", `${left}px`)
                .style("top", `${top}px`);

        })


        .on("mouseleave", function() {

            tooltip
                .style("display", "none");

        });


    // ==========================================
    // FILTER STATE
    // ==========================================

    let selectedType = "all";
    let selectedChapter = "all";


    // ==========================================
    // UPDATE PLACE VISIBILITY
    // ==========================================

    function updatePlaceVisibility() {

        placeCircles
            .transition()
            .duration(300)

            .style("opacity", d => {

                const matchesType =
                    selectedType === "all" ||
                    d.type === selectedType;


                const matchesChapter =
                    selectedChapter === "all" ||
                    d[`chapter_${selectedChapter}`] === "1";


                return matchesType && matchesChapter
                    ? 1
                    : 0;

            })

            .style("pointer-events", d => {

                const matchesType =
                    selectedType === "all" ||
                    d.type === selectedType;


                const matchesChapter =
                    selectedChapter === "all" ||
                    d[`chapter_${selectedChapter}`] === "1";


                return matchesType && matchesChapter
                    ? "all"
                    : "none";

            });

    }


    // ==========================================
    // PLACE TYPE FILTER
    // ==========================================

    const filterButtons =
        d3.selectAll(".filter-btn");


    filterButtons.on("click", function() {

        selectedType =
            d3.select(this)
                .attr("data-filter");


        tooltip
            .style("display", "none");


        filterButtons
            .classed("active", false);

        d3.select(this)
            .classed("active", true);


        updatePlaceVisibility();

    });


    // ==========================================
    // LIFE IN CHAPTERS
    // ==========================================

  // ==========================================
// LIFE IN CHAPTERS
// ==========================================

const chapterTimeline =
    d3.select(".chapter-timeline");

const chapterNodes =
    d3.selectAll(".chapter-node");


// ==========================================
// SELECTED CHAPTER TEXT
// ==========================================

const chapterText =
    d3.select("#chapter-text");

const chapterTextNumber =
    d3.select("#chapter-text-number");

const chapterTextTitle =
    d3.select("#chapter-text-title");

const chapterTextBody =
    d3.select("#chapter-text-body");

updateChapterText();

// ==========================================
// UPDATE CHAPTER TEXT
// ==========================================

function updateChapterText() {

if (selectedChapter === "all") {

    chapterTextNumber

        .text("00")

        .style("visibility", "hidden");

    chapterTextTitle

        .text("From dots to a story");

    chapterTextBody

        .text("Some chapters last months. Others, years. Some were planned, some accidental, and some only became chapters in retrospect. Looking back, the places begin to form a narrative. At the time, they were simply life — a messy sequence of decisions, accidents, departures and new beginnings.");

    chapterText

        .attr("hidden", null);

    return;

}

    const chapterNumber =
        selectedChapter;

    chapterTextNumber
        .text(
            String(chapterNumber).padStart(2, "0")
        )
        .style("visibility", "visible");

    chapterTextTitle
        .text(
            chapterTitles[chapterNumber]
        );

    chapterTextBody
        .text(
            chapterTexts[chapterNumber]
        );

    chapterText
        .attr("hidden", null);

}  


// ==========================================
// CHAPTER HOVER
// ==========================================

chapterNodes
    .on("mouseenter", function() {

        // Hide all labels
        chapterNodes
            .classed("show-title", false);

        // Show only the hovered label
        d3.select(this)
            .classed("show-title", true);

    });

// ==========================================
// LEAVE CHAPTER TIMELINE
// ==========================================

chapterTimeline
    .on("mouseleave", function() {

        // Hide all navigation labels
        // The selected chapter title is already shown
        // in the chapter text below.
        chapterNodes
            .classed("show-title", false);

    });


// ==========================================
// CLICK
// ==========================================

chapterNodes.on("click", function() {

    const clickedChapter =
        d3.select(this)
            .attr("data-chapter");


    tooltip
        .style("display", "none");


    // ==========================================
    // CLICK SELECTED CHAPTER AGAIN
    // = CLEAR CHAPTER FILTER
    // ==========================================

    if (selectedChapter === clickedChapter) {

        selectedChapter = "all";


        chapterNodes
            .classed("active", false)
            .attr("aria-pressed", "false");


        chapterNodes
            .classed("show-title", false);

    }


    // ==========================================
    // SELECT NEW CHAPTER
    // ==========================================

    else {

        selectedChapter = clickedChapter;


        chapterNodes
            .classed("active", false)
            .attr("aria-pressed", "false");


        d3.select(this)
            .classed("active", true)
            .attr("aria-pressed", "true");


        // Show selected label initially
        chapterNodes
            .classed("show-title", false);

        /*d3.select(this)
            .classed("show-title", true);*/

    }


    updatePlaceVisibility();

    updateChapterText();

});

    // ==========================================
    // POWER / LOGARITHMIC SCALE SWITCH
    // ==========================================

    const scaleButtons =
        d3.selectAll(".scale-btn");


    scaleButtons.on("click", function() {

        currentScale =
            d3.select(this)
                .attr("data-scale");


        scaleButtons
            .classed("active", false);

        d3.select(this)
            .classed("active", true);


        placeCircles
            .transition()
            .duration(600)

            .attr("r", d => {

                return getRadius(d.days);

            })

            .attr("fill-opacity", d => {

                return getOpacity(d.days);

            });

    });


    // ==========================================
    // PROJECT INFORMATION PANEL
    // ==========================================

    const infoButton =
        d3.select("#info-button");

    const infoPanel =
        d3.select("#info-panel");

    const infoClose =
        d3.select("#info-close");


    function openInfoPanel() {

        infoPanel
            .classed("open", true)
            .attr("aria-hidden", "false");

        infoButton
            .attr("aria-expanded", "true")
            .classed("active", true);

    }


    function closeInfoPanel() {

        infoPanel
            .classed("open", false)
            .attr("aria-hidden", "true");

        infoButton
            .attr("aria-expanded", "false")
            .classed("active", false);

    }


    infoButton.on("click", function() {

        const isOpen =
            infoPanel.classed("open");

        if (isOpen) {

            closeInfoPanel();

        } else {

            openInfoPanel();

        }

    });


    infoClose.on("click", function() {

        closeInfoPanel();

    });


    // ==========================================
    // CLOSE WITH ESCAPE
    // ==========================================

    d3.select("body")

        .on("keydown.info", function(event) {

            if (

                event.key === "Escape" &&

                infoPanel.classed("open")

            ) {

                closeInfoPanel();

            }

        });


    // ==========================================
    // ZOOM
    // ==========================================

    const zoom = d3.zoom()

        .scaleExtent([1, 20])

        .on("zoom", event => {

            mapGroup
                .attr(
                    "transform",
                    event.transform
                );

        });


    svg.call(zoom);


    // ==========================================
    // INITIAL MAP POSITION
    // ==========================================

    svg.call(
        zoom.transform,
        d3.zoomIdentity
            .translate(-800, -250)
            .scale(2.7)
    );


    // ==========================================
    // ZOOM IN
    // ==========================================

    d3.select("#zoom-in")
        .on("click", () => {

            svg.transition()
                .duration(400)

                .call(
                    zoom.scaleBy,
                    1.5
                );

        });


    // ==========================================
    // ZOOM OUT
    // ==========================================

    d3.select("#zoom-out")
        .on("click", () => {

            svg.transition()
                .duration(300)

                .call(
                    zoom.scaleBy,
                    1 / 1.5
                );

        });


    // ==========================================
    // RESET ZOOM
    // ==========================================

    d3.select("#zoom-reset")
        .on("click", () => {

            svg.transition()
                .duration(400)

                .call(
                    zoom.transform,
                    d3.zoomIdentity
                );

        });

})
.catch(error => {

    console.error(
        "Error loading map or places data:",
        error
    );

});