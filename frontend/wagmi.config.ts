import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/abi/generated.ts',
  plugins: [
    foundry({
      project: '..',             // caminho para o foundry.toml
      include: ['MyToken.sol/**']
    }),
  ],
})
