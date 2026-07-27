import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppProvider, useAppContext } from "./AppContext";

function WishlistHarness() {
  const { wishlist, toggleWishlist } = useAppContext();

  return (
    <div>
      <span data-testid="wishlist-count">{wishlist.length}</span>
      <button onClick={() => toggleWishlist("product-1")}>toggle</button>
    </div>
  );
}

describe("wishlist authentication guard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not add a product to the wishlist when no user is logged in", () => {
    render(
      <AppProvider>
        <WishlistHarness />
      </AppProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /toggle/i }));

    expect(screen.getByTestId("wishlist-count")).toHaveTextContent("0");
  });
});
