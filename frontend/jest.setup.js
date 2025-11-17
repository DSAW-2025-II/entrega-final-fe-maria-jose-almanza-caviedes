import "@testing-library/jest-dom";

if (typeof window !== "undefined" && typeof window.ResizeObserver === "undefined") {
	window.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
