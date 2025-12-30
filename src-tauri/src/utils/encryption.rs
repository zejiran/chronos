use anyhow::Result;
use keyring::Entry;

const SERVICE_NAME: &str = "chronos";

pub struct CredentialStore {
    service: String,
}

impl CredentialStore {
    pub fn new() -> Self {
        Self {
            service: SERVICE_NAME.to_string(),
        }
    }

    pub fn store_token(&self, account_id: &str, token_type: &str, token: &str) -> Result<()> {
        let key = format!("{}_{}", account_id, token_type);
        let entry = Entry::new(&self.service, &key)?;
        entry.set_password(token)?;
        Ok(())
    }

    pub fn get_token(&self, account_id: &str, token_type: &str) -> Result<Option<String>> {
        let key = format!("{}_{}", account_id, token_type);
        let entry = Entry::new(&self.service, &key)?;

        match entry.get_password() {
            Ok(password) => Ok(Some(password)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn delete_token(&self, account_id: &str, token_type: &str) -> Result<()> {
        let key = format!("{}_{}", account_id, token_type);
        let entry = Entry::new(&self.service, &key)?;

        match entry.delete_credential() {
            Ok(_) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
            Err(e) => Err(e.into()),
        }
    }

    pub fn store_access_token(&self, account_id: &str, token: &str) -> Result<()> {
        self.store_token(account_id, "access_token", token)
    }

    pub fn get_access_token(&self, account_id: &str) -> Result<Option<String>> {
        self.get_token(account_id, "access_token")
    }

    pub fn store_refresh_token(&self, account_id: &str, token: &str) -> Result<()> {
        self.store_token(account_id, "refresh_token", token)
    }

    pub fn get_refresh_token(&self, account_id: &str) -> Result<Option<String>> {
        self.get_token(account_id, "refresh_token")
    }

    pub fn delete_all_tokens(&self, account_id: &str) -> Result<()> {
        self.delete_token(account_id, "access_token")?;
        self.delete_token(account_id, "refresh_token")?;
        self.delete_token(account_id, "caldav_password")?;
        Ok(())
    }

    pub fn store_caldav_password(&self, account_id: &str, password: &str) -> Result<()> {
        self.store_token(account_id, "caldav_password", password)
    }

    pub fn get_caldav_password(&self, account_id: &str) -> Result<Option<String>> {
        self.get_token(account_id, "caldav_password")
    }
}

impl Default for CredentialStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore] // Requires keyring access
    fn test_store_and_retrieve_token() {
        let store = CredentialStore::new();
        let account_id = "test_account";
        let token = "test_token_12345";

        // Store token
        store.store_access_token(account_id, token).unwrap();

        // Retrieve token
        let retrieved = store.get_access_token(account_id).unwrap();
        assert_eq!(retrieved, Some(token.to_string()));

        // Delete token
        store.delete_token(account_id, "access_token").unwrap();

        // Verify deletion
        let retrieved = store.get_access_token(account_id).unwrap();
        assert_eq!(retrieved, None);
    }
}
