declare module 'fengari' {
  export type lua_State = any
  
  export const lua: {
    LUA_OK: number
    LUA_MULTRET: number
    LUA_TSTRING: number
    LUA_TNUMBER: number
    LUA_TBOOLEAN: number
    LUA_TNIL: number
    lua_pcall(L: lua_State, nargs: number, nresults: number, errfunc: number): number
    lua_gettop(L: lua_State): number
    lua_type(L: lua_State, index: number): number
    lua_tonumber(L: lua_State, index: number): number
    lua_toboolean(L: lua_State, index: number): boolean
    lua_typename(L: lua_State, type: number): string
    lua_tostring(L: lua_State, index: number): any
    lua_pop(L: lua_State, n: number): void
    lua_pushnil(L: lua_State): void
    lua_pushjsfunction(L: lua_State, func: (L: lua_State) => number): void
    lua_setglobal(L: lua_State, name: any): void
    lua_close(L: lua_State): void
  }
  
  export const lauxlib: {
    luaL_newstate(): lua_State
    luaL_loadstring(L: lua_State, code: any): number
  }
  
  export const lualib: {
    luaL_openlibs(L: lua_State): void
  }
  
  export function to_jsstring(str: any): string
  export function to_luastring(str: string): any
}

