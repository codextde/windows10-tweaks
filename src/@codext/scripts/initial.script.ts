export class InitialScript {
  static script = `
    @echo off
    echo.
    echo #######################################
    echo Check Admin Permissions
    echo #######################################
    echo.
    if %errorLevel% == 0 (
        echo Success: Administrative permissions confirmed.
    ) else (
        echo Failure: Current permissions inadequate.
    )
    echo.
    echo.

  `;
}
