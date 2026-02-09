<script lang="ts">
  import { marked } from 'marked';
  import termsMd from './TermsOfService.md?raw';
  
  const content = marked.parse(termsMd);
</script>

<article class="prose-sm prose prose-invert max-w-none">
  {@html content}
</article>