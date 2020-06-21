import React, { useState } from "react"
import LabelErrorBoundary from "../LabelErrorBoundary"
import UniversalDataViewer from "../UniversalDataViewer"
import Stats from "../Stats"
import SampleGrid from "../SampleGrid"
import Box from "@material-ui/core/Box"
import { setIn } from "seamless-immutable"
import usePosthog from "../../utils/use-posthog"
import duration from "duration"
import { styled } from "@material-ui/core/styles"
import Tabs from "@material-ui/core/Tabs"
import Tab from "@material-ui/core/Tab"
import BorderColorIcon from "@material-ui/icons/BorderColor"
import SupervisedUserCircleIcon from "@material-ui/icons/SupervisedUserCircle"
import DataUsageIcon from "@material-ui/icons/DataUsage"
import LabelHelpView, { useLabelHelp } from "../LabelHelpView"
import ActiveLearningView from "../ActiveLearningView"
import useIsLabelOnlyMode from "../../utils/use-is-label-only-mode"

const OverviewContainer = styled("div")({
  padding: 16,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
})

export default ({
  dataset,
  onChangeDataset,
  singleSampleDataset,
  onChangeSingleSampleDataset,
  selectedBrush = "complete",
  onClickSetup,
  onChangeSampleTimeToComplete,
  sampleTimeToComplete,
}) => {
  const [currentTab, setTab] = useState("label")
  const posthog = usePosthog()
  const { labelHelpEnabled } = useLabelHelp()
  const labelOnlyMode = useIsLabelOnlyMode()
  let percentComplete = 0
  if (dataset.samples && dataset.samples.length > 0) {
    percentComplete =
      dataset.samples
        .map((s) => s.annotation !== undefined && s.annotation !== null)
        .filter(Boolean).length / dataset.samples.length
  }
  return singleSampleDataset ? (
    <LabelErrorBoundary>
      <UniversalDataViewer
        datasetName={`Sample ${singleSampleDataset.sampleIndex}`}
        onSaveTaskOutputItem={(relativeIndex, output) => {
          const {
            sampleIndex,
            samples: [sample],
          } = singleSampleDataset

          let newDataset = dataset
          newDataset = setIn(
            newDataset,
            ["samples", sampleIndex, "annotation"],
            output
          )

          if (
            sample.brush !== selectedBrush &&
            !(sample.brush === undefined && selectedBrush === "complete")
          ) {
            newDataset = setIn(
              newDataset,
              ["samples", sampleIndex, "brush"],
              selectedBrush
            )
          }

          onChangeSingleSampleDataset(
            setIn(singleSampleDataset, ["samples", 0, "annotation"], output)
          )
          onChangeDataset(newDataset)
        }}
        onExit={(nextAction = "nothing") => {
          if (singleSampleDataset.startTime) {
            onChangeSampleTimeToComplete(
              Date.now() - singleSampleDataset.startTime
            )
          }
          const { sampleIndex } = singleSampleDataset
          switch (nextAction) {
            case "go-to-next":
              if (sampleIndex !== dataset.samples.length - 1) {
                posthog.capture("next_sample", {
                  interface_type: dataset.interface.type,
                })
                onChangeSingleSampleDataset({
                  ...dataset,
                  samples: [dataset.samples[sampleIndex + 1]],
                  sampleIndex: sampleIndex + 1,
                  startTime: Date.now(),
                })
                return
              }
              break
            case "go-to-previous":
              if (sampleIndex !== 0) {
                onChangeSingleSampleDataset({
                  ...dataset,
                  samples: [dataset.samples[sampleIndex - 1]],
                  sampleIndex: sampleIndex - 1,
                  startTime: Date.now(),
                })
                return
              }
              break
            default:
              break
          }
          onChangeSingleSampleDataset(null)
        }}
        dataset={singleSampleDataset}
        onClickSetup={onClickSetup}
      />
    </LabelErrorBoundary>
  ) : (
    <OverviewContainer>
      <Box display="flex">
        <Box>
          <Tabs value={currentTab} onChange={(e, newTab) => setTab(newTab)}>
            <Tab icon={<BorderColorIcon />} label="Label" value="label" />
            {!labelOnlyMode && (
              <Tab
                icon={<DataUsageIcon />}
                label="Active Learning"
                value="activelearning"
              />
            )}
            {labelHelpEnabled && (
              <Tab
                icon={<SupervisedUserCircleIcon />}
                label="Label Help"
                value="labelhelp"
              />
            )}
          </Tabs>
        </Box>
        <Box flexGrow={1} />
        <Stats
          stats={[
            {
              name: "Percent Complete",
              value: Math.floor(percentComplete * 100) + "%",
            },
            {
              name: "Time per Sample",
              value: duration(
                new Date(Date.now() - sampleTimeToComplete)
              ).toString(1, 1),
            },
            {
              name: "Estimated Remaining",
              value: duration(
                new Date(
                  Date.now() -
                    sampleTimeToComplete *
                      (1 - percentComplete) *
                      (dataset.samples || []).length
                )
              ).toString(1, 2),
            },
          ]}
        />
      </Box>
      <Box flexGrow={1}>
        {currentTab === "label" && (
          <SampleGrid
            count={(dataset.samples || []).length}
            samples={dataset.samples || []}
            completed={(dataset.samples || []).map((s) =>
              Boolean(s.annotation)
            )}
            onClick={(sampleIndex) => {
              posthog.capture("open_sample", {
                interface_type: dataset.interface.type,
              })
              onChangeSingleSampleDataset({
                ...dataset,
                samples: [dataset.samples[sampleIndex]],
                sampleIndex,
                startTime: Date.now(),
              })
            }}
          />
        )}
        {currentTab === "activelearning" && <ActiveLearningView />}
        {currentTab === "labelhelp" && <LabelHelpView />}
      </Box>
    </OverviewContainer>
  )
}
