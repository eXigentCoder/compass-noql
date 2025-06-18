declare module '@synatic/noql' {
  interface NoqlResult {
    type: 'query' | 'aggregate';
    collection?: string;
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
    projection?: Record<string, any>;
    query: Record<string, any>;
    pipeline?: any[];
  }

  interface NoqlParser {
    parseSQL(sql: string, options: Record<string, any>): NoqlResult;
  }

  const SQLParser: NoqlParser;
  export default SQLParser;
}
