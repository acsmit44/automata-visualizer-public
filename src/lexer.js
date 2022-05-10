lexer = {}
const TokenTypes = {
    LPAREN: 1,
    RPAREN: 2,
    PLUS: 3,
    STAR: 4,
    CHAR: 5,
    END_OF_FILE: 6
}

lexer.createNew = function() {
    var newLexer = {
        tokens: [],
        index: 0,
        reserved: '()+*',
        alphabet: new Set()
    }

    return newLexer;
}

lexer.getToken = function(lex) {
    if (lex.index === lex.tokens.length) {
        console.log("Warning: Trying to get tokens at EOF");
        return {
            TokenType: TokenTypes.END_OF_FILE,
            lexeme: ""
        }
    }
    
    var token = lex.tokens[lex.index];
    lex.index++;
    return token;
}

lexer.ungetToken = function(lex, numTokens) {
    if (numTokens <= 0) {
        throw new Error(`non-positive argument ${numTokens} in ungetToken`);
    }

    lex.index = lex.index - numTokens;
    if (lex.index < 0) {
        console.log(`Warning: woah there, nelly.  You're trying to unget too
                     many tokens.  The lexer is at index ${lex.index} and you
                     are trying to unget ${numTokens} tokens.`);
        lex.index = 0;
    }
}

lexer.peek = function(lex, numTokens) {
    if (numTokens <= 0) {
        throw new Error(`non-positive argument ${numTokens} in peek`);
    }

    var peekIndex = lex.index + numTokens - 1;
    if (peekIndex >= lex.tokens.length) {
        return {
            TokenType: TokenTypes.END_OF_FILE,
            lexeme: ""
        }
    }
    else return lex.tokens[peekIndex];
}

lexer.isAlphaNumeric = function(c) {
    charCode = c.charCodeAt(0);
    if (!(charCode > 47 && charCode < 58) && // numeric (0-9)
        !(charCode > 64 && charCode < 91) && // upper alpha (A-Z)
        !(charCode > 96 && charCode < 123)) { // lower alpha (a-z)
        return false;
    }
    return true;
}

lexer.processInput = function(lex, inputString) {
    var i = 0;
    while (i < inputString.length) {
        let c = inputString[i]
        switch(c) {
            case ' ': break;
            case '(':
                lex.tokens.push({
                    TokenType: TokenTypes.LPAREN,
                    lexeme: '('
                });
                break;
            case ')':
                lex.tokens.push({
                    TokenType: TokenTypes.RPAREN,
                    lexeme: ')'
                });
                break;
            case '+':
                lex.tokens.push({
                    TokenType: TokenTypes.PLUS,
                    lexeme: '+'
                });
                break;
            case '*':
                lex.tokens.push({
                    TokenType: TokenTypes.STAR,
                    lexeme: '*'
                });
                break;
            default:
                if (!lexer.isAlphaNumeric(c) && c !== '$') {
                    throw new Error(`input ${c} is not alphanumeric.`)
                }
                lex.tokens.push({
                    TokenType: TokenTypes.CHAR,
                    lexeme: c
                });
                lex.alphabet.add(c);
                break;
        }
        i++;
    }
}