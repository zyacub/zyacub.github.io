// Global variables
let currentScene = 0;
const scenes = ['intro', 'timeline', 'decades', 'time', 'conclusion'];
let data;

// Load data
d3.csv("GLB.Ts+dSST.csv").then(function(loadedData) {
    console.log("Loaded data:", loadedData);
    data = loadedData;
    updateScene();
}).catch(function(error) {
    console.error("Error loading the CSV file:", error);
});

// Navigation
d3.select("#prevBtn").on("click", () => {
    if (currentScene > 0) {
        currentScene--;
        updateScene();
    }
});

d3.select("#nextBtn").on("click", () => {
    if (currentScene < scenes.length - 1) {
        currentScene++;
        updateScene();
    }
});

function updateScene() {
    // Clear previous content
    d3.select("#chart").html("");

    // Render current scene
    switch(scenes[currentScene]) {
        case 'intro':
            renderIntro();
            break;
        case 'timeline':
            renderTimeline();
            break;
        case 'decades':
            renderDecades();
            break;
        case 'time':
            renderTimeComparison();
            break;
        case 'conclusion':
            renderConclusion();
            break;
    }
}

function renderIntro() {
    console.log("Original data:", data);

    // Parse the data
    const parseYear = d3.timeParse("%Y");
    const filteredData = data.filter(d => d.Year !== "Year" && !isNaN(+d.Year) && !isNaN(+d["J-D"]))
        .map(d => ({
            Year: parseYear(d.Year),
            Annual: +d["J-D"]  
        }));

    console.log("Filtered data:", filteredData);

    // Check if we have valid data
    if (filteredData.length === 0) {
        console.error("No valid data to display");
        return;
    }

    const margin = {top: 40, right: 30, bottom: 50, left: 60};
    const width = 760 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select("#chart").html("");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Annual))
        .nice()
        .range([height, 0]);

    // Create the line
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Annual));

    // Add the X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width/2},${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Year");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Temperature Anomaly (°C)");

    // Add the line path
    svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Function to find the closest X index of the mouse
    const bisect = d3.bisector(d => d.Year).left;

    function mousemove(event) {
        const [xPos] = d3.pointer(event);
        const x0 = x.invert(xPos);
        const i = bisect(filteredData, x0, 1);
        const selectedData = filteredData[i];
        if (selectedData) {
            tooltip
                .html(`Year: ${selectedData.Year.getFullYear()}<br>Temperature Anomaly: ${selectedData.Annual.toFixed(2)}°C`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("opacity", 1);

            svg.selectAll(".tooltip-line").remove();
            svg.append("line")
                .attr("class", "tooltip-line")
                .attr("x1", x(selectedData.Year))
                .attr("x2", x(selectedData.Year))
                .attr("y1", 0)
                .attr("y2", height)
                .style("stroke", "red")
                .style("stroke-width", 1)
                .style("stroke-dasharray", "3,3");
        }
    }

    // Add tooltip
    const tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add mouse events
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { tooltip.style("opacity", 1); })
        .on("mousemove", mousemove)
        .on("mouseout", function() { tooltip.style("opacity", 0); });

    // Add description
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("The Warming Earth: A Century of Temperature Change");

    d3.select("#description")
        .html("Over the past century, Earth's temperature has been rising at an unprecedented rate. " +
              "This visualization will take you through the story of global warming, from overall " +
              "trends to regional impacts. Let's start by looking at the big picture.");
}

function renderTimeline() {
    const margin = {top: 40, right: 80, bottom: 60, left: 60};
    const width = 760 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select("#chart").html("");

    // Add instructions
    d3.select("#chart")
        .append("div")
        .attr("class", "instructions")
        .html("<p><strong>Instructions:</strong> Click on the chart to zoom in. Use the 'Reset Zoom' button to return to the full view.</p>");

    // Add Reset Zoom button
    const resetButton = d3.select("#chart")
        .append("button")
        .text("Reset Zoom")
        .on("click", resetZoom);

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the data
    const parseYear = d3.timeParse("%Y");
    const filteredData = data.filter(d => d.Year !== "Year" && !isNaN(+d.Year) && !isNaN(+d["J-D"]))
        .map(d => ({
            Year: parseYear(d.Year),
            Annual: +d["J-D"]
        }));

    // Set up scales
    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Annual))
        .nice()
        .range([height, 0]);

    // Create the line
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Annual));

    // Add the X Axis
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add the Y Axis
    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line path
    const path = svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Add labels
    svg.append("text")
        .attr("transform", `translate(${width/2},${height + margin.top + 20})`)
        .style("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Temperature Anomaly (°C)");
   

    // Add click-to-zoom functionality
    svg.append("rect")
        .attr("class", "zoom-area")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("click", clicked);

    function clicked(event) {
        const [mouseX] = d3.pointer(event);
        const date = x.invert(mouseX);
        const years5 = 5 * 365.25 * 24 * 60 * 60 * 1000; // 5 years in milliseconds

        x.domain([new Date(date - years5), new Date(date + years5)]);
        updateChart();
    }

    function updateChart() {
        xAxis.transition().duration(750).call(d3.axisBottom(x));
        path.transition().duration(750).attr("d", line);
    }

    function resetZoom() {
        x.domain(d3.extent(filteredData, d => d.Year));
        updateChart();
    }

    // Add tooltip
    const tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add hover effect
    const focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("r", 5);

    focus.append("text")
        .attr("x", 15)
        .attr("dy", ".31em");

    svg.select(".zoom-area")
        .on("mouseover", () => { focus.style("display", null); })
        .on("mouseout", () => { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = x.invert(mouseX);
        const bisect = d3.bisector(d => d.Year).left;
        const i = bisect(filteredData, x0, 1);
        const d0 = filteredData[i - 1];
        const d1 = filteredData[i];
        const d = x0 - d0.Year > d1.Year - x0 ? d1 : d0;
        focus.attr("transform", `translate(${x(d.Year)},${y(d.Annual)})`);
        focus.select("text").text(`${d.Year.getFullYear()}: ${d.Annual.toFixed(2)}°C`);
    }

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("The Long-Term Trend: Temperature Anomalies Since 1880");

    d3.select("#description")
        .html("This chart shows the global temperature anomalies from 1880 to present. " +
              "Notice the sharp increase in temperatures, especially since the 1970s. " +
              "Click on different parts of the chart to zoom in and explore specific periods.");
}

function renderDecades() {
    const margin = {top: 60, right: 30, bottom: 60, left: 60};  // Increased top margin
    const width = 760 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select("#chart").html("");

    // Add instructions
    d3.select("#chart")
        .append("div")
        .attr("class", "instructions")
        .html("<p><strong>Instructions:</strong> Hover over the bars to see exact values. Click on a bar to see yearly breakdown for that decade.</p>");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data for decades
    const decadeData = processDataByDecade(data);

    // Set up scales
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    // Set domains
    x.domain(decadeData.map(d => d.decade));
    y.domain([d3.min(decadeData, d => d.averageAnomaly), d3.max(decadeData, d => d.averageAnomaly)]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add bars
    svg.selectAll(".bar")
        .data(decadeData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.decade))
        .attr("width", x.bandwidth())
        .attr("y", d => y(Math.max(0, d.averageAnomaly)))
        .attr("height", d => Math.abs(y(d.averageAnomaly) - y(0)))
        .attr("fill", d => d.averageAnomaly >= 0 ? "red" : "blue")
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("click", showYearlyBreakdown);

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Average Temperature Anomalies by Decade");

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width/2},${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Decade");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Average Temperature Anomaly (°C)");

    // Add tooltip
    const tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function showTooltip(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`Decade: ${d.decade}<br>Average Anomaly: ${d.averageAnomaly.toFixed(2)}°C`)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    function showYearlyBreakdown(event, d) {
        // Clear the existing chart
        svg.selectAll("*").remove();
    
        // Process data for the selected decade
        const yearlyData = processYearlyData(data, d.decade);
    
        // Update scales for yearly data
        x.domain(yearlyData.map(d => d.year));
        const yExtent = d3.extent(yearlyData, d => d.anomaly);
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% padding
        y.domain([Math.min(yExtent[0], 0) - yPadding, Math.max(yExtent[1], 0) + yPadding]);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");
    
        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y));
    
        // Add bars
        svg.selectAll(".bar")
            .data(yearlyData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.year))
            .attr("width", x.bandwidth())
            .attr("y", d => y(Math.max(0, d.anomaly)))
            .attr("height", d => Math.abs(y(d.anomaly) - y(0)))
            .attr("fill", d => d.anomaly >= 0 ? "red" : "blue")
            .on("mouseover", showYearlyTooltip)
            .on("mouseout", hideTooltip);
    
       
        // Add X axis label
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", `translate(${width/2},${height + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .text("Year");
    
        // Add Y axis label
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Anomaly (°C)");

            
        // Add chart title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2 + 10)  
            .attr("text-anchor", "middle")
            .text(`Yearly Temperature Anomalies for ${d.decade}`);

        // Add back button
        svg.append("text")
            .attr("class", "back-button")
            .attr("x", 10)
            .attr("y", -margin.top / 2 + 10)  
            .text("← Back to Decades")
            .style("cursor", "pointer")
            .on("click", renderDecades);
        
        // Update description
        d3.select("#description")
            .html(`This chart shows the yearly temperature anomalies for the ${d.decade}. ` +
                  `You can see how temperatures varied from year to year within this decade.`);
    }
    
    function showYearlyTooltip(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`Year: ${d.year}<br>Anomaly: ${d.anomaly.toFixed(2)}°C`)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    // Update description
    d3.select("#description")
        .html("This chart shows the average temperature anomalies by decade. " +
              "Notice how recent decades show significantly higher anomalies, " +
              "highlighting the accelerating pace of global warming.");
}

function processDataByDecade(data) {
    const decadeData = {};
    
    data.forEach(d => {
        if (d.Year !== "Year" && !isNaN(+d.Year) && !isNaN(+d["J-D"])) {
            const decade = Math.floor(+d.Year / 10) * 10;
            if (!decadeData[decade]) {
                decadeData[decade] = [];
            }
            decadeData[decade].push(+d["J-D"]);
        }
    });

    return Object.entries(decadeData).map(([decade, anomalies]) => ({
        decade: `${decade}s`,
        averageAnomaly: d3.mean(anomalies)
    })).sort((a, b) => a.decade.localeCompare(b.decade));
}
function processYearlyData(data, decade) {
    const startYear = parseInt(decade);
    const endYear = startYear + 9;
    return data
        .filter(d => {
            const year = +d.Year;
            return year >= startYear && year <= endYear && !isNaN(+d["J-D"]);
        })
        .map(d => ({
            year: d.Year,
            anomaly: +d["J-D"]
        }))
        .sort((a, b) => a.year - b.year);
}
function renderTimeComparison() {
    const margin = {top: 60, right: 30, bottom: 60, left: 60};
    const width = 760 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select("#chart").html("");

    // Add instructions
    d3.select("#chart")
        .append("div")
        .attr("class", "instructions")
        .html("<p><strong>Instructions:</strong> Hover over the bars to see exact values for each period.</p>");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data for time periods
    const timePeriodsData = processTimePeriodsData(data);

    // Set up scales
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    // Set domains
    x.domain(timePeriodsData.map(d => d.period));
    const yExtent = d3.extent(timePeriodsData, d => d.averageAnomaly);
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% padding
    y.domain([Math.min(yExtent[0], 0) - yPadding, Math.max(yExtent[1], 0) + yPadding]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add bars
    svg.selectAll(".bar")
        .data(timePeriodsData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.period))
        .attr("width", x.bandwidth())
        .attr("y", d => y(Math.max(0, d.averageAnomaly)))
        .attr("height", d => Math.abs(y(d.averageAnomaly) - y(0)))
        .attr("fill", d => d.averageAnomaly >= 0 ? "red" : "blue")
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip);

    // Add chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .text("Average Temperature Anomalies by 30-Year Periods");

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width/2},${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Time Period");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Average Temperature Anomaly (°C)");

    // Add tooltip
    const tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function showTooltip(event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(`Period: ${d.period}<br>Average Anomaly: ${d.averageAnomaly.toFixed(2)}°C`)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    // Update description
    d3.select("#description")
        .html("This chart compares average temperature anomalies across different 30-year periods. " +
              "Notice how the average anomaly has dramatically increased in recent periods, " +
              "highlighting the accelerating pace of global warming.");
}
function processTimePeriodsData(data) {
    const periods = [
        {start: 1880, end: 1909, label: "1880-1909"},
        {start: 1910, end: 1939, label: "1910-1939"},
        {start: 1940, end: 1969, label: "1940-1969"},
        {start: 1970, end: 1999, label: "1970-1999"},
        {start: 1990, end: 2019, label: "1990-2019"},
        {start: 1994, end: 2023, label: "1994-2023"}
    ];

    return periods.map(period => {
        const periodData = data.filter(d => {
            const year = parseInt(d.Year);
            return year >= period.start && year <= period.end;
        });
        
        const anomalies = periodData.map(d => parseFloat(d["J-D"])).filter(v => !isNaN(v));
        return {
            period: period.label,
            averageAnomaly: d3.mean(anomalies)
        };
    });
}

function renderConclusion() {
    const margin = {top: 60, right: 80, bottom: 60, left: 60};
    const width = 760 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select("#chart").html("");

    // Add title
    d3.select("#chart")
        .append("h2")
        .attr("class", "conclusion-title")
        .text("The Warming Earth: A Century of Change");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data
    const parseYear = d3.timeParse("%Y");
    const filteredData = data.filter(d => d.Year !== "Year" && !isNaN(+d.Year) && !isNaN(+d["J-D"]))
        .map(d => ({
            Year: parseYear(d.Year),
            Annual: +d["J-D"]
        }));

    // Set up scales
    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Annual))
        .nice()
        .range([height, 0]);

    // Create the line
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Annual));

    // Add the X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line path
    svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Add key points
    const keyPoints = [
        {year: 1910, label: "Industrial Revolution impact"},
        {year: 1970, label: "Accelerated warming begins"},
        {year: 2016, label: "Warmest year on record"}
    ];

    svg.selectAll(".key-point")
        .data(keyPoints)
        .enter()
        .append("circle")
        .attr("class", "key-point")
        .attr("cx", d => x(parseYear(d.year.toString())))
        .attr("cy", d => y(filteredData.find(fd => fd.Year.getFullYear() === d.year).Annual))
        .attr("r", 5)
        .attr("fill", "red");

    svg.selectAll(".key-point-label")
        .data(keyPoints)
        .enter()
        .append("text")
        .attr("class", "key-point-label")
        .attr("x", d => x(parseYear(d.year.toString())))
        .attr("y", d => y(filteredData.find(fd => fd.Year.getFullYear() === d.year).Annual) - 10)
        .attr("text-anchor", "middle")
        .text(d => d.label);

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width/2},${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Time Period");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Temperature Anomaly (°C)");

    // Add conclusion text
    d3.select("#description")
        .html(`
            <p>As we've seen throughout this visualization:</p>
            <ul>
                <li>Global temperatures have risen dramatically over the past century.</li>
                <li>The rate of warming has accelerated in recent decades.</li>
                <li>The last decade has been the warmest on record.</li>
                <li>These changes are having significant impacts on our climate and ecosystems.</li>
            </ul>
            <p>This conclusion chart summarizes the overall trend, highlighting key points in the history of global warming. 
            The data clearly shows the urgent need for action to address climate change and its impacts.</p>
        `);
}