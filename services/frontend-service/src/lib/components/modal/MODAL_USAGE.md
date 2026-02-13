# Global Modal System Usage

The global modal system allows any component in the app to trigger modals without worrying about containment issues.

## Architecture

Each modal is a **component-based modal** with its own `.svelte` component registered in the root layout.

Current modals:
- **Privacy Policy** (`'privacy'`) — renders markdown content
- **Terms of Service** (`'terms'`) — renders markdown content
- **Profile Settings** (`'profileSettings'`) — settings UI

## How to Use

### Import the store
```typescript
import { modalStore } from '$lib/components/modal/modal';
```

### Open a modal
```typescript
modalStore.open('privacy');
modalStore.open('terms');
modalStore.open('profileSettings');

// With optional data
modalStore.open('profileSettings', { tab: 'account' });
```

### Close a modal
```typescript
modalStore.close();
```

## Adding a New Modal

1. **Add the modal type** to `modal.ts`:
```typescript
export type ModalType = 'privacy' | 'terms' | 'profileSettings' | 'your-new-modal' | null;
```

2. **Add title** to `modalConfig.ts`:
```typescript
export const modalConfig = {
  'your-new-modal': {
    title: 'Your Modal Title'
  }
};
```

3. **Create the component** `YourNewModal.svelte`:
```svelte
<script lang="ts">
  // Your modal logic
</script>

<div>
  <!-- Your modal content -->
</div>
```

4. **Register in +layout.svelte**:
```svelte
{:else if $modalStore.type === 'your-new-modal'}
  <Modal title={modalConfig['your-new-modal'].title} ...>
    <YourNewModal />
  </Modal>
```

## Example: Opening modal from a button
```svelte
<script>
  import { modalStore } from '$lib/components/modal/modal';
</script>

<button onclick={() => modalStore.open('privacy')}>
  View Privacy Policy
</button>
```
