/*
This file uses Thompson's construction to create an epsilon NFA.
*/
nfa = {};

nfa.createNew = function(isFinal) {
    const newState = {
        id: -1,
        isFinal: isFinal,
        transitions: {},
        eTransitions: [],
    };

    return newState;
};

nfa.addEpsilonTransition = function(from, to) {
    if (from.eTransitions.includes(to)) {
        console.log(`Warning: ${to} already in ${from}'s epsilon transitions`)
    }
    else {
        from.eTransitions.push(to);
    }
};

nfa.addTransition = function(from, symbol, to) {
    if (symbol in from.transitions) {
        throw new Error(`${to} already in ${from}'s transitions`)
    }
    from.transitions[symbol] = to;
};

nfa.createEmpty = function() {
    const q = nfa.createNew(false);
    const f = nfa.createNew(true);
    nfa.addEpsilonTransition(q, f);
    return {q, f};
};

nfa.createSingleTransition = function(symbol) {
    const q = nfa.createNew(false);
    const f = nfa.createNew(true);
    nfa.addTransition(q, symbol, f);
    return {q, f};
};

nfa.union = function(Ns, Nt) {
    const q = nfa.createNew(false);
    const f = nfa.createNew(true);

    nfa.addEpsilonTransition(q, Ns.q);
    nfa.addEpsilonTransition(q, Nt.q);

    nfa.addEpsilonTransition(Ns.f, f);
    nfa.addEpsilonTransition(Nt.f, f);

    Ns.f.isFinal = false;
    Nt.f.isFinal = false;

    return {q, f};
};

nfa.concatenate = function(Ns, Nt) {
    // Takes in two smaller NFAs and connects the final state of the first to
    // the initial state of the second via epsilon transition
    Ns.f.isFinal = false;
    for (let e of Nt.q.eTransitions) {
        nfa.addEpsilonTransition(Ns.f, e);
    }
    
    // Ns.f.eTransitions = Nt.q.eTransitions;
    for (let symbol in Nt.q.transitions) {
        nfa.addTransition(Ns.f, symbol, Nt.q.transitions[symbol]);
    }

    // Not necessary but deleting the attributes will make it easy to indentify
    // if this causes any errors
    for (let symbol in Nt.q.transitions) {
        delete Nt.q.transitions[symbol];
    }
    delete Nt.q.eTransitions;
    q = Ns.q;
    f = Nt.f;

    return {q, f};
};

nfa.kleene = function(Ns) {
    const q = nfa.createNew(false);
    const f = nfa.createNew(true);
    Ns.f.isFinal = false;

    nfa.addEpsilonTransition(q, Ns.q);
    nfa.addEpsilonTransition(q, f);
    nfa.addEpsilonTransition(Ns.f, Ns.q);
    nfa.addEpsilonTransition(Ns.f, f);

    return {q, f};
};

nfa.init = function(machineState, enfa) {
    machineState.add(enfa.q);
    nfa.doEpsilonTransitions(enfa.q, machineState);
};

nfa.run = function(enfa, inputString) {
    const machineState = new Set();
    nfa.init(machineState, enfa);
    for (let i = 0; i < inputString.length; i++){
        let c = inputString[i];
        nfa.advanceState(enfa, machineState, c);
    }

    return nfa.isFinalState(machineState);
};

nfa.doEpsilonTransitions = function(state, machineState) {
    // Recursively add all epsilon transitions to the machine state by
    // depth-first search
    for (let i = 0; i < state.eTransitions.length; i++) {
        const alreadyInSet = machineState.has(state.eTransitions[i]);
        if (!alreadyInSet) {
            machineState.add(state.eTransitions[i]);
            nfa.doEpsilonTransitions(state.eTransitions[i], machineState);
        }
    }
};

nfa.advanceState = function(NFA, machineState, input) {
    // First do all normal transitions
    let nextMachineState = new Set();
    for (let state of machineState) {
        if (input in state.transitions) {
            nextMachineState.add(state.transitions[input]);
        }
    }

    // Do all epsilon transitions
    let nextMachineStateArray = Array.from(nextMachineState);
    for (let nextState of nextMachineStateArray) {
        nfa.doEpsilonTransitions(nextState, nextMachineState);
    }

    // Set "current" machine state to the next one we just computed
    machineState.clear();
    for (let state of nextMachineState) {
        machineState.add(state);
    }
};

nfa.isFinalState = function(machineState) {
    for (let state of machineState) {
        if (state.isFinal) {
            return true;
        }
    }
    return false;
};

nfa.assignStateIDs = function(fsm) {
    let count = 0;
    let doEpsilonTransitions = function(state, stateQueue) {
        for (let i = 0; i < state.eTransitions.length; i++) {
            let nextState = state.eTransitions[i];
            if (nextState.id === -1) {
                stateQueue.push(nextState);
                nextState.id = count++;
            }
        }
    };

    let doInputTransition = function(state, stateQueue) {
        let transitionSymbols = Object.keys(state.transitions);
        for (let input of transitionSymbols) {
            let nextState = state.transitions[input];
            stateQueue.push(nextState);
            nextState.id = count++;
        }
    };

    let stateQueue = [fsm.q];
    fsm.q.id = count++;
    while (stateQueue.length > 0) {
        let curState = stateQueue.shift();
        doInputTransition(curState, stateQueue);
        doEpsilonTransitions(curState, stateQueue);
    }
};

nfa.machineStateToString = function(machineState) {
    if (machineState.size === 0) {
        return '-1';
    }
    let ids = [];
    for (let state of machineState) {
        ids.push(state.id);
    }
    ids.sort();
    return ids.join(',');
};