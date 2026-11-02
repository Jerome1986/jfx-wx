const fs = require('node:fs')
const target = 'D:/project/code/jfx/jfx-api/src/address/address.service.ts'
const staged = fs.readFileSync(__dirname + '/address-admin-fix/address.service.ts', 'utf8')
const original = staged.replace("includes(user.role ?? '')", 'includes(user.role)')
if (fs.readFileSync(target, 'utf8').trimEnd() !== original.trimEnd()) throw new Error('Source changed')
fs.copyFileSync(__dirname + '/address-admin-fix/address.service.ts', target)
