/*
GRAMMAR:
regex_section 	-> regex
regex 			-> simple_regex
regex 			-> simple_regex PLUS regex
simple_regex 	-> basic_regex
simple_regex 	-> basic_regex simple_regex
basic_regex 	-> elemen_regex
basic_regex 	-> elemen_regex STAR
elemen_regex 	-> LPAREN regex RPAREN
elemen_regex 	-> char
char 			-> any_nonmeta_char
*/

parser = {}
var firstSets = {
    regexSection: [TokenTypes.LPAREN, TokenTypes.CHAR],
    regex: [TokenTypes.LPAREN, TokenTypes.CHAR],
    simpleRegex: [TokenTypes.LPAREN, TokenTypes.CHAR],
    basicRegex: [TokenTypes.LPAREN, TokenTypes.CHAR],
    elementaryRegex: [TokenTypes.LPAREN, TokenTypes.CHAR],
    char: [TokenTypes.CHAR],
}

parser.syntaxError = function(currentToken, lex) {
    throw new Error("Syntax Error at token " + currentToken.lexeme
                    + " and index " + lex.index);
}

parser.expect = function(lex, expectedTokenType) {
    var tempToken = lexer.getToken(lex);
    if (tempToken.TokenType != expectedTokenType) {
        parser.syntaxError(tempToken, lex);
    }

    return tempToken;
}

parser.parseRegexSection = function(lex) {
    var nextToken = lexer.peek(lex, 1);
    if (nextToken.lexeme === '') {
        return nfa.createEmpty();
    }
    fsm = parser.parseRegex(lex);
    parser.expect(lex, TokenTypes.END_OF_FILE);
    return fsm;
}

parser.parseRegex = function(lex) {
    // parse: regex -> simple_regex
    fsm = parser.parseSimpleRegex(lex);

    // parse: regex -> simple_regex PLUS simple_regex
    var nextToken = lexer.peek(lex, 1);
    if (nextToken.TokenType === TokenTypes.PLUS) {
        parser.expect(lex, TokenTypes.PLUS);
        fsm = nfa.union(fsm, parser.parseRegex(lex));
    }
    return fsm;
}

parser.parseSimpleRegex = function(lex) {
    fsm = parser.parseBasicRegex(lex);

    var nextToken = lexer.peek(lex, 1);
    if (firstSets.simpleRegex.includes(nextToken.TokenType)) {
        fsm = nfa.concatenate(fsm, parser.parseSimpleRegex(lex));
    }
    return fsm;
}

parser.parseBasicRegex = function(lex) {
    fsm = parser.parseElementaryRegex(lex);

    var nextToken = lexer.peek(lex, 1);
    if (nextToken.TokenType === TokenTypes.STAR) {
        parser.expect(lex, TokenTypes.STAR);
        fsm = nfa.kleene(fsm);
    }
    return fsm
}

parser.parseElementaryRegex = function(lex) {
    var token = lexer.peek(lex, 1);
    if (token.TokenType === TokenTypes.LPAREN) {
        parser.expect(lex, TokenTypes.LPAREN);
        fsm = parser.parseRegex(lex);
        parser.expect(lex, TokenTypes.RPAREN);
    }
    else if (token.TokenType === TokenTypes.CHAR) {
        fsm = parser.parseChar(lex);
    }
    else {
        parser.syntaxError(token, lex);
    }
    return fsm;
}

parser.parseChar = function(lex) {
    var token = parser.expect(lex, TokenTypes.CHAR);
    if (token.lexeme === '$') {
        fsm = nfa.createEmpty();
    }
    else {
        fsm = nfa.createSingleTransition(token.lexeme);
    }
    return fsm;
}