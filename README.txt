~~~~~~~~~~~~~~~
~~~ PSITURK ~~~
~~~~~~~~~~~~~~~

-- Folders --

Static : Contains the code to run the experiment (Javascript, CSS)
Templates : Contains the template HTML files needed to display pages in the experiment

-- Scripts --

ave_accuracy.py : Prints the average accuracy across blocks of data
generate_text.py: 
jsontest.py: Reads the database and prints them out in json format


-- Others --

config.txt : Configure parameters for the DB and server 
participants.db : SQLite DB file which contains the results of all previously conducted experiments

—- Tutorial —-

https://psiturk.org/quick_start/

1. navigate to /Users/mjc/Dropbox/psiturk/psiturk-delayed or immediate

2. "psiturk"

3. "server on"

4. "mode" to change to live

5. hit create no_of_participants reward_per_hit duration_of_hit
   e.g. hit create 100 6.00 24

6. check the ad URL given

7. check data in participants.db

8. "hit list —-active" to see progress

9. once done, "mode" to change back to debug


http://psiturk.readthedocs.org/en/latest/command_line_overview.html
"debug" to test experiment
"amt_balance" to check balance
