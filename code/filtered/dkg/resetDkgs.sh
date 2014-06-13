#!/bin/bash
echo ""
read -p "Are you sure you want to remove all DKG data in /Applications/XAMPP/htdocs/thesis/? (y/N)" ANS
# displays "Yes or no (y/N" and stores a user's input as a variable, ANS
if [ "$ANS" = "y" ]; then
# if ANS is y, then
rm -r /Applications/XAMPP/htdocs/thesis/dkg*
echo "DKG data successfully removed"
else
# if input is not y or N
echo "Nothing was removed."
fi
echo ""
exit 0
# exits script with status code 0
