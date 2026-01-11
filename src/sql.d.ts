declare module 'sql.js' {
  export interface Database {
    prepare(sql: string): Statement;
    close(): void;
    run(sql: string): void;
    exec(sql: string): any[];
  }

  export interface Statement {
    bind(params: any[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, any>;
    free(): boolean;
    reset(): void;
  }

  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;

  export interface SqlJsStatic {
    Database: new (data: Uint8Array) => Database;
  }
}
