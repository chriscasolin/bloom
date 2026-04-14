#!/bin/dash

for file in $1/*
do
    name="$(echo $file | sed -E 's/rock/granite/')"
    echo $name
    mv $file $name
done