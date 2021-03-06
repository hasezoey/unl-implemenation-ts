export const whiteSpace = /\s/i; // matches all whitespaces " "

export const numbers = /[0-9]/i; // matches all numbers
export const hexNumber = /[0-9a-f]/i; // matcher for hex numbers

export const namesStartWith = /[a-z_]/i; // matches all text-character and "_" (underscore)
export const namesUntilEnd = /[a-z0-9_]/i; // matches all text-characters and all numbers and "_" (underscore)

export const newLine = /\n|\r|\r\n/i; // matches a new line (LF | CRLF)

export const strings = /"|`/i; // matches " and `

export const fullLineComment = /\/\//i; // matches "//"

export const inLineCommentStart = /\/\*/i; // matches "/*"
export const inLineCommentEnd = /\*\//i; // matches "*/"

export const stringVariants = [/"/i, /`/i];

export const dot = /\./i; // matches "."
