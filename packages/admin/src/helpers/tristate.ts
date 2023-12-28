/** Action for setting tristate checkboxes */
export function tristate(el: HTMLInputElement, open: boolean | null) {
	function update(open: boolean | null) {
		if (open) {
			el.indeterminate = false;
			el.checked = true;
		} else if (open === null) {
			el.indeterminate = true;
			el.checked = false;
		} else {
			el.indeterminate = false;
			el.checked = false;
		}
	}
	update(open);
	return { update };
}