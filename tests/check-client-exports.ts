import * as betterAuthClient from 'better-auth/client';
import * as betterAuthClientPlugins from 'better-auth/client/plugins';

console.log('Exports from "better-auth/client":');
console.log(Object.keys(betterAuthClient).filter(k => !k.startsWith('_')));

console.log('\nExports from "better-auth/client/plugins":');
console.log(Object.keys(betterAuthClientPlugins).filter(k => !k.startsWith('_')));
