utils = {
    set: {}
};

/*
 * Checks if element a is in A, adds it regardless of whether it is or isn't,
 * then returns whether it was.
 * 
 * @param {Set} A The set to add to.
 * @param {a} a The element being added.
 * @return {boolean} True if the element was already in the set, false otherwise.
 **/
utils.set.checkAndAdd = function(A, a) {
    const isIn = A.has(a);
    A.add(a);
    return isIn;
};

utils.set.union = function(A, B) {
    // not exactly a union, but adds all elements of B to A
    for (let b of B) {
        A.add(b);
    }
};

utils.set.isEmpty = function(A) {
    if (A.size === 0) {
        return true;
    }
    return false;
};