/*
 * Copyright (C) 2018-2020 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Command, CommandParams, CommandResult } from "./base"
import { printHeader } from "../logger/util"
import dedent = require("dedent")
import { login } from "../enterprise/auth"
import { CommandError, ConfigurationError } from "../exceptions"
import { findProjectConfig } from "../config/base"

export class LoginCommand extends Command {
  name = "login"
  help = "Log in to Garden Enterprise."
  hidden = true

  /**
   * Since we're logging in, we don't want to resolve e.g. the project config (since it may use secrets, which are
   * only available after we've logged in).
   */
  noProject = true

  description = dedent`
    Logs you in to Garden Enterprise. Subsequent commands will have access to enterprise features.
  `

  async action({ garden, log, headerLog }: CommandParams): Promise<CommandResult> {
    printHeader(headerLog, "Login", "cloud")
    // Since this command has `noProject = true`, `garden` only has a placeholder project config.
    // So we find and load it here, without resolving any template strings.
    const currentDirectory = garden.projectRoot
    const projectConfig = await findProjectConfig(garden.projectRoot)
    if (!projectConfig) {
      throw new CommandError(`Not a project directory (or any of the parent directories): ${currentDirectory}`, {
        currentDirectory,
      })
    }
    const enterpriseDomain = projectConfig.domain
    if (!enterpriseDomain) {
      throw new ConfigurationError(`Error: Your project configuration does not specify a domain.`, {})
    }
    await login(enterpriseDomain, log)
    return {}
  }
}
