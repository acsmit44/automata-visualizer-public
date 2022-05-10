visualizer = {};
let graphData = {
    nodes: [],
    edges: []
};
let networkData = {
    nodes: undefined,
    edges: undefined
};

visualizer.drawNonterminalNode = function({ ctx, id, x, y, 
        state: { selected, hover }, style, label }) {
    const r = style.size;
    function draw() {
        // draw outer circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = style.color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    
        ctx.font = '20px Courier New';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 5);
    };
    return {
        drawNode() {
            draw();
        },
        nodeDimensions: {r, r}
    };
};

visualizer.drawTerminalNode = function({ ctx, id, x, y, 
        state: { selected, hover }, style, label }) {
    const r = style.size;
    function draw()
    {
        // draw outer circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = style.color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // draw inner circle
        ctx.beginPath();
        ctx.arc(x, y, r - 5, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();
    
        ctx.font = '20px Courier New';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 5);
    }
    return {
        drawNode() {
            draw();
        },
        nodeDimensions: {r, r}
    };
};

visualizer.addNode = function(graphData, node) {
    let drawFunc;
    let node_label;
    if (node.isFinal) {
        drawFunc = visualizer.drawTerminalNode;
        node_label = `q${node.id}`
    }
    else {
        drawFunc = visualizer.drawNonterminalNode;
        node_label = `q${node.id}`
    }
    graphData.nodes.push({
        id: node.id,
        label: node_label,
        shape: 'custom',
        color: 'white',
        ctxRenderer: drawFunc
    });
};

visualizer.addEdge = function(graphData, from, symbol, to) {
    graphData.edges.push({
        from: from.id,
        to: to.id,
        label: symbol,
        arrows: 'to',
        color: 'black',
        font: {
            color: 'red',
            size: 24
        },
        selfReference: {
            size: 40,
            angle: Math.PI / 4
        },
        smooth: {
            type: 'curvedCW',
            roundness: 0.2
        }
    });
};

visualizer.createGraphFromNFA = function(graphData, NFA) {
    let doEpsilonTransitions = function(state, stateQueue, closedList, graphData) {
        for (let i = 0; i < state.eTransitions.length; i++) {
            let nextState = state.eTransitions[i];
            if (!closedList.has(nextState)) {
                stateQueue.push(nextState);
                closedList.add(nextState);
                visualizer.addNode(graphData, nextState);
            }
            visualizer.addEdge(graphData, state, '$', nextState);
        }
    };

    let doInputTransition = function(state, stateQueue, graphData) {
        let transitionSymbols = Object.keys(state.transitions);
        for (let input of transitionSymbols) {
            let nextState = state.transitions[input];
            stateQueue.push(nextState);
            visualizer.addNode(graphData, nextState);
            visualizer.addEdge(graphData, state, input, nextState);
        }
    };

    let stateQueue = [NFA.q];
    let closedList = new Set();
    closedList.add(NFA.q);
    visualizer.addNode(graphData, NFA.q);
    while (stateQueue.length > 0) {
        let curState = stateQueue.shift();
        doInputTransition(curState, stateQueue, graphData);
        doEpsilonTransitions(curState, stateQueue, closedList, graphData);
    }
};

visualizer.createGraphFromDFA = function(graphData, DFA) {
    let safeAddNode = function(graphData, DFA, stateID, inGraph) {
        if (!inGraph.has(stateID)) {
            visualizer.addNode(graphData, DFA.states[stateID]);
        }
        inGraph.add(stateID);
    };

    let safeAddEdge = function(graphData, from, symbol, to) {
        let existingEdge = graphData.edges.find(function (edge) {
            if (edge.from === from.id && edge.to === to.id) {
                return true;
            }
        });
        if (existingEdge === undefined) {
            visualizer.addEdge(graphData, from, symbol, to);
        }
        else {
            existingEdge.label += `,${symbol}`;
        }
    };

    let inGraph = new Set();
    for (let fromID in DFA.states) {
        let from = DFA.states[fromID];
        safeAddNode(graphData, DFA, fromID, inGraph);
        for (let symbol of DFA.alphabet) {
            let to = from.transitions[symbol];
            safeAddNode(graphData, DFA, to.strID, inGraph);
            safeAddEdge(graphData, from, symbol, to);
        }
    }
};

visualizer.colorStates = function(machineState, networkData) {
    for (let nodeID of networkData.nodes.getIds()) {
        let node = networkData.nodes.get(nodeID);
        node.color = 'white';
        networkData.nodes.update(node);
    }
    for (let state of machineState) {
        let node = networkData.nodes.get(state.id);
        node.color = '#88C599';
        networkData.nodes.update(node);
    }
};

visualizer.reset = function(networkData) {
    for (let nodeID of networkData.nodes.getIds()) {
        let node = networkData.nodes.get(nodeID);
        node.color = 'white';
        networkData.nodes.update(node);
    }
};

// create an array with nodes
let nodes = new vis.DataSet([
    { id: 1, label: "Create an automaton\nto see it show\nup in this window" }
]);

// create an array with edges
let edges = new vis.DataSet([]);

// create a network
let container = document.getElementById("mynetwork");
let data = {
    nodes: nodes,
    edges: edges,
};
let options = {};
new vis.Network(container, data, options);