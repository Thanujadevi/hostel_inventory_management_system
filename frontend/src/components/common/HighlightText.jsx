import React from 'react';

/**
 * Highlights word prefixes matching the search query.
 */
export const HighlightText = ({ text, query }) => {
  if (text === null || text === undefined) return null;
  const str = String(text);
  if (!query || !query.trim()) return str;

  const rawQuery = query.trim().toLowerCase();
  const tokens = rawQuery.split(/[\s\-_,.]+/).filter(Boolean);

  if (tokens.length === 0) return str;

  // Split text into words (alphanumeric sequences) and non-word delimiters
  const parts = str.split(/([a-zA-Z0-9]+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (!part) return null;

        const isWord = /^[a-zA-Z0-9]+$/.test(part);
        if (!isWord) return <React.Fragment key={index}>{part}</React.Fragment>;

        const lowerPart = part.toLowerCase();

        // Find token that matches the START of this word
        const matchingToken = tokens.find(t => lowerPart.startsWith(t));
        if (matchingToken) {
          const matchLen = matchingToken.length;
          const highlightedPrefix = part.slice(0, matchLen);
          const remainder = part.slice(matchLen);

          return (
            <React.Fragment key={index}>
              <mark
                style={{
                  backgroundColor: '#fef08a',
                  color: '#854d0e',
                  fontWeight: 700,
                  padding: '1px 3px',
                  borderRadius: '3px',
                  boxShadow: '0 0 0 1px rgba(234,179,8,0.5)'
                }}
              >
                {highlightedPrefix}
              </mark>
              {remainder}
            </React.Fragment>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
