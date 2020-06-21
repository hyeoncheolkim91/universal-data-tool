// @flow weak

import React, { useState } from "react"
import SimpleDialog from "../SimpleDialog"
import { styled } from "@material-ui/core/styles"
import { setIn } from "seamless-immutable"
import Box from "@material-ui/core/Box"
import Select from "react-select"
import range from "lodash/range"

const ErrorBox = styled("pre")({
  color: "red",
  whiteSpace: "prewrap",
  fontSize: 11,
})

const splitOptions = [
  { label: "2x2", value: "2x2" },
  { label: "3x3", value: "3x3" },
  { label: "4x4", value: "4x4" },
  { label: "3x4", value: "3x4" },
]

export default ({ open, onChangeDataset, onClose, dataset }) => {
  const [errors, setErrors] = useState("")
  const [splitType, setSplitType] = useState(splitOptions[0].value)
  return (
    <SimpleDialog
      open={open}
      onClose={onClose}
      title="Convert Image Samples into Segments"
      actions={[
        {
          text: "Convert Image Samples into Segments",
          onClick: async () => {
            const [w, h] = splitType.split("x").map((v) => parseInt(v))

            try {
              onChangeDataset(
                setIn(
                  dataset,
                  ["samples"],
                  range(h).flatMap((y) =>
                    range(w).flatMap((x) =>
                      dataset.samples.map((s) => {
                        return setIn(s, ["allowedArea"], {
                          x: x / w,
                          y: y / h,
                          width: 1 / w,
                          height: 1 / h,
                        })
                      })
                    )
                  )
                )
              )
              onClose()
            } catch (e) {
              setErrors(e.toString())
            }
          },
        },
      ]}
    >
      This transformation will multiply the number of image samples you have,
      splitting each individual image into segments. The image is not processed
      and clipped, but rather an "allowedArea" property is placed on the sample
      which limits the labeling to a section of the image. This is useful when
      trying to reduce the amount of work per image sample.
      <Box padding={4}>
        <Select
          defaultValue={splitOptions[0]}
          options={splitOptions}
          onChange={({ value }) => setSplitType(value)}
        />
      </Box>
      {errors && <ErrorBox>{errors}</ErrorBox>}
    </SimpleDialog>
  )
}
