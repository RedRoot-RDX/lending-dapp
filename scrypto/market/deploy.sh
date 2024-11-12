echo "Resim Auto-Setup"
resim reset

temp_account=`resim new-account`
echo "$temp_account"

export account=`echo "$temp_account" | grep Account | grep -o "account_.*"`
export privatekey=`echo "$temp_account" | grep Private | sed "s/Private key: //"`
export account_badge=`echo "$temp_account" | grep Owner | grep -o "resource_.*"`
export xrd=`resim show $account | grep XRD | grep -o "resource_.\S*" | sed -e "s/://"`

export package=`resim publish . | sed "s/Success! New Package: //"`