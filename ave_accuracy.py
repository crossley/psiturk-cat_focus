import sqlite3
import json

db = sqlite3.connect('participants.db')

result = db.execute("SELECT * FROM turkdemo WHERE status = '4'")
results = result.fetchall()

num_of_subjects = len(results)
num_of_trials = 600
block_size = 25
average_results = [0] * (num_of_trials / block_size)

curr_subject = 1

for r in results:
	# select datastring column
	string = r[16] 
 	json_string = json.loads(string)["data"]
 	counter, trace = 0.0, 1
 	# select trialdata
 	for i in range(3, len(json_string) - 2):
 		hit = json_string[i]["trialdata"]["hit"]
 		if trace % block_size == 0:
 			average_results[trace / block_size - 1] = average_results[trace / block_size - 1] + counter / block_size
 			counter = 0.0
 		if hit:
 			counter = counter + 1.0
 		trace = trace + 1
 	curr_subject = curr_subject + 1

print [x / num_of_subjects for x in average_results]


