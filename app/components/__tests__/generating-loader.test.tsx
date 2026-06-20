import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GeneratingLoader } from "../generating-loader";

describe("GeneratingLoader", () => {
  it("renders each letter of 'Generating'", () => {
    render(<GeneratingLoader />);
    const letters = "Generating".split("");
    letters.forEach((letter) => {
      expect(screen.getAllByText(letter).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders with status role for accessibility", () => {
    render(<GeneratingLoader />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the prompt caption when provided", () => {
    render(<GeneratingLoader prompt="a red cube" />);
    expect(screen.getByText("a red cube")).toBeInTheDocument();
  });

  it("does not render a caption when prompt is omitted", () => {
    const { container } = render(<GeneratingLoader />);
    expect(container.querySelector(".generating-caption")).toBeNull();
  });

  it("applies sequential animation delays to letters", () => {
    const { container } = render(<GeneratingLoader />);
    const spans = container.querySelectorAll(".loader-letter");
    expect(spans.length).toBe("Generating".length);
    spans.forEach((span, index) => {
      expect((span as HTMLElement).style.animationDelay).toBe(`${index * 0.1}s`);
    });
  });
});
