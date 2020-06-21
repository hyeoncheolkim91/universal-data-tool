describe("Create a new", () => {
  it("should be able to create", () => {
    cy.visit("/")

    cy.contains("New File").click()
  })

  it("should be able to import cat images dataset", () => {
    cy.contains("Samples").click()
    cy.contains("Import Toy Dataset").click()
    cy.contains("Cats").siblings("td").eq(2).click()
  })

  it("should be able to setup image segmentation", () => {
    cy.contains("Setup").click()
    cy.contains("Image Segmentation").click()
    cy.contains("bounding-box").click()
    cy.get("li[data-value=polygon]").click()
    cy.get("li[data-value=point]").click()
    cy.get("body").click()
    cy.get("input[value=valid]").each(($el, index, $list) => {
      cy.get($el).focus().clear().type("cat")
    })
    cy.get("input[value=invalid]").each(($el, index, $list) => {
      cy.get($el).focus().clear()
    })
  })

  it("should be able to see samples", () => {
    cy.contains("Samples").click()
  })

  it("should be able start labeling images", () => {
    cy.contains("div", "21").click()
  })

  it('should be able to select add bounding box with "b" which is a shortcut key', () => {
    cy.get("body").click().type("b")
  })

  // TODO: change coordinates with cat coordinates
  it("should be able to draw a label box on canvas", () => {
    cy.get("canvas")
      .eq(0)
      .trigger("mousedown", { button: 0, screenX: 0, screenY: 210 })
      .trigger("mousemove", { button: 0, screenX: 0, screenY: 350 })
      .trigger("mousemove", { button: 0, screenX: 100, screenY: 350 })
      .trigger("mouseup", { force: true })
    cy.wait(50)
  })

  it("should be able to label that box as a cat", () => {
    cy.contains("#1").click()
    cy.contains("Classification").click().type("cat{enter}")
    cy.wait(100)
  })

  it("should be able to go to next image", () => {
    cy.contains("Next").click()
  })
})
