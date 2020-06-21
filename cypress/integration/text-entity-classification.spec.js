const times = (howManyTimes) => (functionWillExecute) => {
  if (howManyTimes > 0) {
    functionWillExecute()
    times(howManyTimes - 1)(functionWillExecute)
  }
}

const negative = {
  id: "negative",
  displayName: "offensive",
  description: "I felt negative things about that ",
}

const neutral = {
  id: "neutral",
  displayName: "neutral",
  description: "I don't feel anything about that",
}

const positive = {
  id: "positive",
  displayName: "lovely",
  description: "I felt positive things about that",
}

const inputValues = [positive, negative, neutral]

// You need to ```npm start```
describe("Create a new text entity classification, label that and show that", () => {
  it("should be able to create new file", () => {
    cy.visit("/")

    cy.contains("New File").click()
  })

  it("should import Elon Musk tweets from toy datasets", () => {
    cy.contains("Samples").click()
    cy.contains("Import Toy Dataset").click()
    cy.contains("Elon Musk Tweets").siblings("td").eq(2).click()
  })

  it("should be able to go to 'Setup' and select 'Text Classification'", () => {
    cy.contains("Setup").click()
    cy.contains("Text Classification").click()
  })

  it("should be able to clear labels before writing to them", () => {
    //TODO: When added new tags to inputs make element selection more semantic
    cy.get("input[type=text]").each(($el, index, $list) => {
      if (index > 1 && inputValues[Math.floor((index - 2) / 3)]) {
        const currentValueGroupIndex = Math.floor((index - 2) / 3)
        const currentValueGroup = inputValues[currentValueGroupIndex]
        const currentValueIndex = (index - 2) % 3
        const currentValue = Object.values(currentValueGroup)[currentValueIndex]
        cy.get($el).focus().clear().type(currentValue)
      }
    })
  })

  it("should be able to go to samples", () => {
    cy.contains("Samples").click()
  })

  it("should be able to start labelling texts", () => {
    cy.contains("div", "21").click()
  })

  it("should be able to show button descriptions on hover", () => {
    cy.contains("lovely").trigger("mouseover")
    cy.wait(100)
    cy.contains("offensive").trigger("mouseover")
    cy.wait(100)
    cy.contains("neutral").trigger("mouseover")
    cy.wait(100)
  })

  it("should be able to label texts entities", () => {
    times(4)(() => {
      cy.get("body").click().type("n")
      cy.get("body").click().type("{enter}")
      cy.wait(100)
    })
  })

  it("should be able to return samples tab", () => {
    cy.contains("Samples").click()
    cy.wait(30)
  })

  it("should be able to show label tab", () => {
    cy.contains("Label").click()
  })
})
