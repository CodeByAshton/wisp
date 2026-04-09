import { useState } from 'react'
import type { Meta, StoryObj } from 'wisp'
import { Modal } from './Modal'
import { Button } from '../Inputs/Button'

const meta: Meta<typeof Modal> = {
  title: 'Modal',
  component: Modal,
  parameters: {
    docs: `# Modal

An overlay dialog for focused interactions that require user input or confirmation.

## Usage

\`\`\`tsx
const [open, setOpen] = useState(false)

<Button onClick={() => setOpen(true)} label="Open Modal" />
<Modal open={open} onClose={() => setOpen(false)} title="Confirm action">
  Are you sure you want to proceed?
</Modal>
\`\`\`

## Accessibility

- Traps focus within the modal when open
- Closes on Escape key
- Closes on backdrop click (configurable via \`closeOnBackdrop\`)
- \`aria-modal\` and \`role="dialog"\` are set automatically
`,
  },
  argTypes: {
    title: { control: 'text', description: 'Modal heading' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Modal width',
    },
    closeOnBackdrop: {
      control: 'boolean',
      description: 'Close when clicking backdrop',
    },
  },
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" label="Cancel"  onClick={() => setOpen(false)} />
              <Button variant="primary"   label="Confirm" onClick={() => setOpen(false)} />
            </>
          }
        >
          <p>This is the modal body. You can put any content here, including forms, lists, or rich text.</p>
        </Modal>
      </div>
    )
  },
  args: { title: 'Confirm action', size: 'md', closeOnBackdrop: true },
}

export const Destructive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button variant="destructive" label="Delete account" onClick={() => setOpen(true)} />
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary"   label="Cancel"         onClick={() => setOpen(false)} />
              <Button variant="destructive" label="Delete forever" onClick={() => setOpen(false)} />
            </>
          }
        >
          <p>
            <strong>This action cannot be undone.</strong> All your data, settings, and history
            will be permanently deleted.
          </p>
        </Modal>
      </div>
    )
  },
  args: { title: 'Delete account', size: 'sm', closeOnBackdrop: true },
}

export const Large: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button label="Open large modal" onClick={() => setOpen(true)} />
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={<Button variant="primary" label="Done" onClick={() => setOpen(false)} />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>A larger modal for more complex workflows like multi-step forms or data tables.</p>
            <div style={{ height: 160, background: 'var(--color-fill-tertiary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-label-tertiary)', fontSize: 13 }}>
              Content area
            </div>
          </div>
        </Modal>
      </div>
    )
  },
  args: { title: 'Edit profile', size: 'lg', closeOnBackdrop: true },
}
