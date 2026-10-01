import type { HelloWorld } from "#components/hello-world";

declare global {
	interface HTMLElementTagNameMap {
		"hello-world": HelloWorld;
	}
}
