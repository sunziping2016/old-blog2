import * as path from 'path'

import { createServer } from 'vitepress'

createServer(path.join(__dirname, '../site'), {})
    .then((server) => server.listen())
    .catch(() => {
        process.exit(1)
    })
