set base=..\..\src\main\webapp
set work=%base%\coverage

@rem release/h5.js h5.min.js テスト用
xcopy /S /E /I %base%\release %work%\qunitTestOrg\release

mkdir %work%\qunitTestOrg\src
copy /-Y /V %base%\src\h5.dev.js %work%\qunitTestOrg\src\h5.dev.js

@rem src/h5.api.js h5.core.controller.js h5.js h5.log.js h5.u.js h5.view.js テスト用
xcopy /S /E /I %base%\src %work%\qunitTestOrg\src

xcopy /S /E /I %base%\test %work%\qunitTestOrg\test
xcopy /S /E /I %base%\lib %work%\qunitTestOrg\lib

jscoverage.exe --no-instrument=\lib --no-instrument=test\runner.js --no-instrument=test --encoding=UTF-8 %work%\qunitTestOrg %work%\inst