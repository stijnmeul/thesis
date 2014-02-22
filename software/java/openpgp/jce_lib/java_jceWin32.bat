@ECHO OFF
:: This is a file to update the Java Virtual Machine with the JCE unrestricted policies
:: Two arguments required  ./java_jce [pwd]
SETLOCAL

:: Import Libraries
set file1=US_export_policy
set file2=local_policy
set lib_path=lib\security
::set filetest=test

:: Get Java Home Path
echo Get Java Home Path! ...

set full_path=%JAVA_HOME:~-1%
echo %full_path%
IF "%full_path%"=="\" GOTO remelse
    echo here
    set full_path=%JAVA_HOME%\%lib_path%
    GOTO ENDIFrem
:remelse
    echo deu merdum here
    set full_path=%JAVA_HOME%%lib_path%
:ENDIFrem
 
echo %full_path%
:: Check If Folder Exists
echo Check If Directory is Valid ...

IF EXIST "%full_path%" GOTO else
::    echo Path not valid check if its inside bin library and if there is a jre folder...
    set full_path=%JAVA_HOME:bin\=%%lib_path%
::    echo FULL PATH %full_path%    
    IF EXIST "%full_path%" GOTO else2
        echo add jre to the path...
        set full_path=%JAVA_HOME%jre\%lib_path%
    
        IF EXIST "%full_path%" GOTO elseEnd
                echo error ... path not found > exit!
                GOTO ENDIF2        
        :elseEnd
            echo ok now...
        :ENDIF2
        GOTO ENDIF
    :else2
        echo ok now...
    :ENDIF
    GOTO END
:else
    echo path found... transfer files
:END

:: Backup Files and Copy New Ones 
echo %full_path%
echo Backup Files and Copy New Ones  ...
COPY "%full_path%\%file1%.jar" "%full_path%\%file1%2.jar" /B /V
COPY "%full_path%\%file2%.jar" "%full_path%\%file2%2.jar" /B /V
COPY "%CD%\%file1%.jar" "%full_path%\%file1%.jar" /B /V
COPY "%CD%\%file2%.jar" "%full_path%\%file2%.jar" /B /V
echo DONE...

