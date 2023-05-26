<script lang="ts">
	import { tristate } from "~/helpers/tristate";

  type T = $$Generic<{ id: number }>;

  let headerEl: HTMLTableRowElement;

  export let selected: Set<number>;
  export let items: T[];
  export let selectable: (item: T, index: number, items: T[]) => unknown = () => true;

	$: available = items.filter(selectable);
	$: allChecked = available.every((i) => selected.has(i.id));

  $: checkboxState = allChecked
		? true
		: available.some((i) => selected.has(i.id))
		? null
		: false;

  function toggleCurrent() {
		if (allChecked) {
			available.forEach((i) => selected.delete(i.id));
			selected = new Set(selected);
		} else {
			available.forEach((i) => selected.add(i.id));
			selected = new Set(selected);
		}
	}
</script>

<table class="table">
  <thead>
    <tr bind:this={headerEl}>
      <slot name="header" />
      <th>
        <input
          role="button"
          type="checkbox"
          title={allChecked ? "deselect all" : "select all"}
          use:tristate={checkboxState}
          on:click={toggleCurrent}
        />
      </th>
    </tr>
  </thead>
  <tbody>
    {#each items as item, index (item.id)}
      <tr>
        <slot name="body" {item} />
        <td class="text-center">
          {#if selectable(item, index, items)}
            <input
              type="checkbox"
              value={item.id}
              name="id"
              checked={selected.has(item.id)}
              on:change={(e) => {
                if (e.currentTarget.checked) {
                  selected = new Set(selected.add(item.id));
                } else if (selected.delete(item.id)) {
                  selected = new Set(selected);
                }
              }}
            />
          {:else}
            <slot name="nonselectable" />
          {/if}
        </td>
      </tr>
    {:else}
      <tr>
        <td colspan={headerEl?.querySelectorAll("th").length}>
          <slot name="empty">No elements is there to show!</slot>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
<p>
  {#if selected.size > 0}
    Selected {selected.size} {selected.size === 1 ? "element" : "elements"}.
    <button class="inline" on:click={() => (selected = new Set())} type="button"
      >deselect all</button
    >
  {:else}
    Select some elements with checkboxes to perform operations on them.
  {/if}
</p>