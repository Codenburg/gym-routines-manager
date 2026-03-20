import * as betterAuth from 'better-auth';
import * as betterAuthPlugins from 'better-auth/plugins';

console.log('Exports from "better-auth":');
console.log(Object.keys(betterAuth).filter(k => !k.startsWith('_')));

console.log('\nExports from "better-auth/plugins":');
console.log(Object.keys(betterAuthPlugins).filter(k => !k.startsWith('_')));
