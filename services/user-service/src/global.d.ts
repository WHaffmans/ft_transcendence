declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): this;
    close(): void;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: any): Database;
    (filename: string, options?: any): Database;
  }

  namespace Database {
    export type Database = import('better-sqlite3').Database;
    export type Statement = import('better-sqlite3').Statement;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
