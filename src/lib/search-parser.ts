export interface SearchQuery {
  tags: string[];
  ratingOp?: { op: '>' | '<' | '>=' | '<=' | '='; value: number };
  yearOp?: { op: '>' | '<' | '>=' | '<=' | '='; value: number };
  text: string;
}

export function parseSearch(input: string): SearchQuery {
  const result: SearchQuery = { tags: [], text: '' };
  const parts: string[] = [];
  
  // Match tag:value, rating>N, year:N patterns
  const tagRegex = /tag:(\S+)/g;
  const ratingRegex = /rating\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)/;
  const yearRegex = /year\s*[:=]\s*(\d{4})/;
  
  let remaining = input;

  let match;
  while ((match = tagRegex.exec(input)) !== null) {
    result.tags.push(match[1]);
    remaining = remaining.replace(match[0], '');
  }

  const ratingMatch = remaining.match(ratingRegex);
  if (ratingMatch) {
    result.ratingOp = { op: ratingMatch[1] as any, value: parseFloat(ratingMatch[2]) };
    remaining = remaining.replace(ratingMatch[0], '');
  }

  const yearMatch = remaining.match(yearRegex);
  if (yearMatch) {
    result.yearOp = { op: '=', value: parseInt(yearMatch[1], 10) };
    remaining = remaining.replace(yearMatch[0], '');
  }

  result.text = remaining.trim();
  return result;
}
