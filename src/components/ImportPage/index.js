// @flow weak

import React, { useState, createContext } from "react"
import MuiButton from "@material-ui/core/Button"
import { styled } from "@material-ui/core/styles"
import AssignmentReturnedIcon from "@material-ui/icons/AssignmentReturned"
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder"
import TextFieldsIcon from "@material-ui/icons/TextFields"
import DescriptionIcon from "@material-ui/icons/Description"
import PetsIcon from "@material-ui/icons/Pets"
import * as colors from "@material-ui/core/colors"
import PasteUrlsDialog from "../PasteUrlsDialog"
import ImportFromS3Dialog from "../ImportFromS3Dialog"
import ImportTextSnippetsDialog from "../ImportTextSnippetsDialog"
import useElectron from "../../utils/use-electron"
import classnames from "classnames"
import S3Icon from "./S3Icon"
import isEmpty from "lodash/isEmpty"
import { setIn } from "seamless-immutable"
import useEventCallback from "use-event-callback"
import ImportFromGoogleDriveDialog from "../ImportFromGoogleDriveDialog"
import ImportUDTFileDialog from "../ImportUDTFileDialog"
import ImportToyDataset from "../ImportToyDatasetDialog"
import ImportFromYoutubeUrls from "../ImportFromYoutubeUrls"
import { FaGoogleDrive, FaYoutube } from "react-icons/fa"
import usePosthog from "../../utils/use-posthog"
import promptAndGetSamplesFromLocalDirectory from "./prompt-and-get-samples-from-local-directory.js"
import { useTranslation } from "react-i18next"

const ButtonBase = styled(MuiButton)({
  width: 240,
  height: 140,
  display: "inline-flex",
  flexDirection: "column",
  "&.disabled": {
    backgroundColor: colors.grey[200],
  },
  margin: 8,
  "& .icon": {
    width: 48,
    height: 48,
    color: colors.grey[600],
    "&.disabled": {
      color: colors.grey[400],
    },
  },
})

const DesktopOnlyText = styled("div")({
  fontSize: 11,
  fontWeight: "bold",
  color: colors.grey[600],
  "&.disabled": {
    color: colors.grey[500],
  },
})

const SelectDialogContext = createContext()

const Button = ({
  Icon,
  desktopOnly,
  isDesktop,
  children,
  dialog,
  authConfiguredOnly,
  authConfig,
  signedInOnly,
  user,
}) => {
  const posthog = usePosthog()
  const disabled = desktopOnly
    ? !isDesktop
    : authConfiguredOnly
    ? signedInOnly
      ? isEmpty(user)
      : isEmpty(authConfig)
    : false

  const { t, i18n } = useTranslation()

  return (
    <SelectDialogContext.Consumer>
      {({ onChangeDialog }) => {
        return (
          <ButtonBase
            onClick={() => {
              posthog.capture("import_button_clicked", {
                import_button: dialog,
              })
              onChangeDialog(dialog)
            }}
            className={classnames({ disabled })}
            variant="outlined"
            disabled={disabled}
          >
            <div>
              <Icon className={classnames("icon", { disabled })} />
              <div>{children}</div>
              {desktopOnly && (
                <DesktopOnlyText className={classnames({ disabled })}>
                  {t("desktop-only").toUpperCase()}
                </DesktopOnlyText>
              )}
              {authConfiguredOnly && isEmpty(authConfig) && (
                <DesktopOnlyText className={classnames({ disabled })}>
                  {t("auth-must-be-configured").toUpperCase()}
                </DesktopOnlyText>
              )}
              {signedInOnly && isEmpty(user) && (
                <DesktopOnlyText className={classnames({ disabled })}>
                  {t("must-be-signed-in").toUpperCase()}
                </DesktopOnlyText>
              )}
            </div>
          </ButtonBase>
        )
      }}
    </SelectDialogContext.Consumer>
  )
}

export default ({
  // TODO remove file, onChangeFile
  file,
  onChangeFile,

  dataset,
  onChangeDataset,
  isDesktop,
  authConfig,
  user,
}) => {
  const { t, i18n } = useTranslation()
  const [selectedDialog, changeDialog] = useState()
  const electron = useElectron()
  const onChangeDialog = async (dialog) => {
    switch (dialog) {
      case "upload-directory": {
        if (!electron) return
        const localSamples = await promptAndGetSamplesFromLocalDirectory({
          electron,
        })
        onChangeDataset(
          setIn(
            dataset,
            ["samples"],
            (dataset.samples || []).concat(localSamples)
          ),
          true
        )
        return
      }
      default: {
        return changeDialog(dialog)
      }
    }
  }

  const closeDialog = () => changeDialog(null)

  const onAddSamples = useEventCallback(async (samplesToAdd) => {
    onChangeDataset(
      setIn(dataset, ["samples"], (dataset.samples || []).concat(samplesToAdd))
    )
    closeDialog()
  })

  return (
    <SelectDialogContext.Provider value={{ onChangeDialog }}>
      <div>
        <Button
          isDesktop={isDesktop}
          dialog="paste-image-urls"
          Icon={AssignmentReturnedIcon}
          authConfig={authConfig}
          signedInOnly={false}
          user={user}
        >
          {t("paste-urls")}
        </Button>
        <Button
          desktopOnly
          isDesktop={isDesktop}
          dialog="upload-directory"
          Icon={CreateNewFolderIcon}
          authConfig={authConfig}
          signedInOnly={false}
          user={user}
        >
          {t("files-from-directory")}
        </Button>
        <Button dialog="import-text-snippets" Icon={TextFieldsIcon}>
          {t("import-text-snippets")}
        </Button>
        <Button
          isDesktop={isDesktop}
          dialog="import-toy-dataset"
          Icon={PetsIcon}
        >
          {t("import-toy-dataset")}
        </Button>
        <Button
          isDesktop={isDesktop}
          dialog="youtube-urls"
          Icon={FaYoutube}
          desktopOnly
        >
          {t("import-from")} Youtube URLs
        </Button>
        {file && (
          <Button
            isDesktop={isDesktop}
            dialog="import-from-s3"
            Icon={S3Icon}
            authConfiguredOnly={true}
            authConfig={authConfig}
            signedInOnly={true}
            user={user}
          >
            {t("import-from")} S3
          </Button>
        )}
        <Button
          isDesktop={isDesktop}
          dialog="google-drive-file-picker"
          Icon={FaGoogleDrive}
          onAddSamples={onAddSamples}
        >
          {t("import-from")} Google Drive
        </Button>
        <Button dialog="import-csv-json" Icon={DescriptionIcon}>
          {t("import-from")} CSV / JSON
        </Button>
        <ImportTextSnippetsDialog
          open={selectedDialog === "import-text-snippets"}
          onClose={closeDialog}
          onAddSamples={onAddSamples}
        />
        <PasteUrlsDialog
          open={selectedDialog === "paste-image-urls"}
          onClose={closeDialog}
          onAddSamples={onAddSamples}
        />
        {file && (
          <ImportFromS3Dialog
            file={file}
            authConfig={authConfig}
            open={selectedDialog === "import-from-s3"}
            onChangeFile={onChangeFile}
            onClose={closeDialog}
            user={user}
            onAddSamples={onAddSamples}
          />
        )}
        <ImportFromGoogleDriveDialog
          open={selectedDialog === "google-drive-file-picker"}
          onClose={closeDialog}
          onAddSamples={onAddSamples}
        />
        <ImportToyDataset
          open={selectedDialog === "import-toy-dataset"}
          onClose={closeDialog}
          onAddSamples={onAddSamples}
        />
        <ImportFromYoutubeUrls
          open={selectedDialog === "youtube-urls"}
          onClose={closeDialog}
          onAddSamples={onAddSamples}
        />
        <ImportUDTFileDialog
          open={selectedDialog === "import-csv-json"}
          onClose={closeDialog}
          onAddSamples={onAddSamples}
        />
      </div>
    </SelectDialogContext.Provider>
  )
}
