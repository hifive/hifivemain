hifiveMain
----------------------------------------------

This project is for the development of "hifive."

This file describes how to build, release, and development hifive.

1.Clone of the repository
  $ git clone git@github.com:hifive/hifivemain.git

2.Add the libraries required to build using Apache ivy
  Run the resolve target of hifive / ivy_build.xml.

  -From the command line
   $ cd hifive
   $ ant -buildfile ivy_build.xml

  -From IDE (eclipse)
   Import the project hifive -> context menu of "hifive/ivy_build.xml" -> Run As -> Ant Build

3.Build hifive

  -Run the "build" target of hifive/build_for_js.xml.

  -From the command line
   $ cd hifive
   $ ant -buildfile build_for_js.xml

  -From IDE (eclipse)
   context menu of "hifive/build_for_js.xml" -> Run As -> Ant Build

  Then input version......
    hifive/src/main/webapp/archives/current/
      ejs-h5mod.js
      h5.css
      h5.dev.js
      h5.js
   will be generated!!!!

------------------------------------------------------------

How to generate the API document (JSDoc document):

1.Download jsdoc3 to generate JSDoc documentation

  -Download jsdoc3
   https://github.com/jsdoc3/jsdoc

  -put all files & folders in hifive/jsTool/jsdoc/bin
   (The "jsdoc" command will be in the "bin" folder.)

2.Generate

  -Run the "jsdoc" target in build_for_js.xml.
   The generated docuemnts will be putted in hifive/src/main/webapp/doc.


------------------------------------------------------------

How to test hifive:

1.Download the jscoverage jscoverage.exe and put them in jsTool/jscoverage.
  - http://siliconforks.com/jscoverage/

2.Run the "jscoverage" target of build_for_js.xml

3.Place the following files to the "lib/selenium"
  - firebug-x.x.x-fx.xpi  http://getfirebug.com/
  - chromedriver          http://code.google.com/p/selenium/

4.Add the prerequisite libraries

  - Please refer to hifive/src/main/webapp/index.html.

5.To run the CoverageMargeTest.
  - From IDE (eclipse)
  a.Install the tomcat plug-in, make the settings.
  - http://www.eclipsetotale.com/tomcatPlugin.html

  b.Tomcat update the definition.

  c.Tomcat startup.

  d.Junit run in "CoverageMargeTest".