<script>
  const ellipseL = '/assets/ellipse-top-right.svg';
  const ellipseR = '/assets/ellipse-bottom-left.svg';
</script>

<!-- Top Right Decoration - Center at corner, 3/4 clipped out -->
<div class="absolute right-0 top-0 size-[600px] translate-x-1/2 -translate-y-1/2">
  <div class="absolute inset-[-58.33%]">
    <img src={ellipseL} alt="" class="block max-w-none size-full" />
  </div>
</div>

<!-- Bottom Left Decoration - Center at corner, 3/4 clipped out -->
<div class="absolute left-0 bottom-0 size-[600px] -translate-x-1/2 translate-y-1/2">
  <div class="absolute inset-[-58.33%]">
    <img src={ellipseR} alt="" class="block max-w-none size-full" />
  </div>
</div>
