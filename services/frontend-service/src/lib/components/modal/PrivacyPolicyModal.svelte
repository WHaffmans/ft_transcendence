<script lang="ts">
  import { marked } from 'marked';
  import privacyMd from './PrivacyPolicy.md?raw';
  
  const content = marked.parse(privacyMd);
</script>

<article class="prose-sm prose prose-invert max-w-none">
  {@html content}
</article>