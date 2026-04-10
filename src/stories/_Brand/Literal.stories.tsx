import type { Meta, StoryObj } from 'wisp'
import logoUrl from '../Logo+text.png'

const meta: Meta = {
  title: 'Literal',
  parameters: {
    docs: `# Literal

The Literal brand logo — white wordmark with bracket icon on dark background.

Use this asset as the primary brand identity across all surfaces.
`,
  },
}

export default meta
type Story = StoryObj

export const Logo: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
        background: '#000',
        borderRadius: '12px',
      }}
    >
      <img
        src={logoUrl}
        alt="Literal logo"
        style={{ height: '48px', display: 'block' }}
      />
    </div>
  ),
}

export const LogoLarge: Story = {
  name: 'Logo Large',
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 100px',
        background: '#000',
        borderRadius: '12px',
      }}
    >
      <img
        src={logoUrl}
        alt="Literal logo"
        style={{ height: '80px', display: 'block' }}
      />
    </div>
  ),
}

export const LogoOnLight: Story = {
  name: 'Logo on Light',
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
        background: '#f5f5f5',
        borderRadius: '12px',
      }}
    >
      <img
        src={logoUrl}
        alt="Literal logo"
        style={{ height: '48px', display: 'block', filter: 'invert(1)' }}
      />
    </div>
  ),
}
