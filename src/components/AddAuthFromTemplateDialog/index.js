// @flow

import React, { useState } from "react"
import Button from "@material-ui/core/Button"
import { makeStyles } from "@material-ui/core/styles"
import authTemplates from "./authTemplates"
import SimpleDialog from "../SimpleDialog"
import isEmpty from "lodash/isEmpty"
import Survey from "material-survey/components/Survey"
import ErrorToasts from "../ErrorToasts"
import useErrors from "../../utils/use-errors.js"
import Amplify from "aws-amplify"
import { useAppConfig } from "../AppConfig"
import * as colors from "@material-ui/core/colors"

const useStyles = makeStyles({
  bigButton: {
    padding: 10,
    width: 150,
    height: 120,
    border: "1px solid #ccc",
    margin: 10,
  },
  bigIcon: {
    width: 48,
    height: 48,
  },
  cognitoIcon: {
    width: 48,
    height: 48,
  },
  howToSetupText: {
    padding: 16,
    color: colors.grey[600],
    "& a": {
      color: colors.blue[500],
      textDecoration: "none",
    },
  },
})

const forms = {
  cognito: {
    questions: [
      {
        name: "auth.cognito.identity_pool_id",
        title: "Amazon Cognito Identity Pool ID",
        placeholder: "XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab",
        type: "text",
        isRequired: true,
      },
      {
        name: "auth.cognito.region",
        title: "AWS Region",
        placeholder: "XX-XXXX-X",
        type: "text",
        isRequired: true,
      },
      {
        name: "auth.cognito.user_pool_id",
        title: "Amazon Cognito User Pool ID",
        placeholder: "XX-XXXX-X_12ab34cd9",
        type: "text",
        isRequired: true,
      },
      {
        name: "auth.cognito.user_pool_web_client_id",
        title: "Amazon Cognito Web Client ID",
        placeholder: "26-char alphanumeric string",
        type: "text",
        isRequired: true,
      },
      {
        name: "auth.cognito.storage.aws_s3.bucket",
        title: "Bucket AWS",
        placeholder: "Name of the bucket",
        type: "text",
        isRequired: true,
      },
      {
        name: "auth.cognito.storage.aws_s3.region",
        title: "Region of the bucket",
        placeholder: "XX-XXXX-X",
        type: "text",
        isRequired: true,
      },
    ],
  },
}

export default ({ open, onClose, onSelect, onFinish, onAuthConfigured }) => {
  const c = useStyles()
  const [authProvider, setAuthProvider] = useState(null)
  const [dialogTitle, setDialogTitle] = useState("Add Authentication")
  const [errors, addError] = useErrors()
  const { appConfig, setAppConfig, fromConfig, setInConfig } = useAppConfig()

  // TODO useAppConfig to load in existing configuration

  const validateAuthProvider = async (answers) => {
    if (answers.provider === "cognito") {
      const config = {
        Auth: {
          identityPoolId: answers["auth.cognito.identity_pool_id"],
          region: answers["auth.cognito.region"],
          userPoolId: answers["auth.cognito.user_pool_id"],
          userPoolWebClientId: answers["auth.cognito.user_pool_web_client_id"],
          mandatorySignIn: true,
          authenticationFlowType: "USER_PASSWORD_AUTH",
        },
        Storage: {
          AWSS3: {
            bucket: answers["auth.cognito.storage.aws_s3.bucket"],
            region: answers["auth.cognito.storage.aws_s3.region"],
          },
        },
      }

      try {
        Amplify.configure(config)
      } catch (err) {
        addError("Invalid Cognito config: " + err.toString())
        return
      }

      setAppConfig({
        ...appConfig,
        ...answers,
        "auth.provider": answers.provider,
      })
      // TODO some kind of success message
      onClose()
    }
  }

  return (
    <>
      <SimpleDialog
        title={dialogTitle}
        open={open}
        onClose={() => {
          onClose()
        }}
        onFinish={onFinish}
      >
        {isEmpty(authProvider) &&
          authTemplates.map((template, i) => (
            <Button
              key={template.name}
              onClick={() => {
                setAuthProvider(template.provider)
                setDialogTitle(`Add Authentication for ${template.name}`)
              }}
              className={c.bigButton}
            >
              <div>
                <div>{template.name}</div>
                <div>
                  <template.Icon className={c.cognitoIcon} />
                </div>
              </div>
            </Button>
          ))}
        {authProvider === "cognito" && (
          <div className={c.howToSetupText}>
            Check this wiki{" "}
            <a href="https://github.com/UniversalDataTool/universal-data-tool/wiki/Cognito---Amplify-Authentication-Setup-Instructions">
              guide for setting up AWS Cognito with the Universal Data Tool
            </a>
            .
          </div>
        )}
        {!isEmpty(authProvider) && forms[authProvider] && (
          <Survey
            variant="flat"
            form={forms[authProvider]}
            onQuestionChange={(questionId, newValue) => {
              setInConfig(questionId, newValue)
            }}
            onFinish={(answers) => {
              answers["provider"] = authProvider
              validateAuthProvider(answers)
            }}
            defaultAnswers={{
              "auth.cognito.identity_pool_id": fromConfig(
                "auth.cognito.identity_pool_id"
              ),
              "auth.cognito.region": fromConfig("auth.cognito.region"),
              "auth.cognito.user_pool_id": fromConfig(
                "auth.cognito.user_pool_id"
              ),
              "auth.cognito.user_pool_web_client_id": fromConfig(
                "auth.cognito.user_pool_web_client_id"
              ),
              "auth.cognito.storage.aws_s3.bucket": fromConfig(
                "auth.cognito.storage.aws_s3.bucket"
              ),
              "auth.cognito.storage.aws_s3.region": fromConfig(
                "auth.cognito.storage.aws_s3.region"
              ),
              "auth.provider": fromConfig("auth.provider"),
            }}
          />
        )}
        <ErrorToasts errors={errors} />
      </SimpleDialog>
    </>
  )
}
