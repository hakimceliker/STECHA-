from app.core.security import hash_password, verify_password


def test_password_hash_round_trip_uses_bcrypt_without_passlib_backend_probe():
    hashed = hash_password("sifre1234")

    assert hashed.startswith("$2")
    assert verify_password("sifre1234", hashed) is True
    assert verify_password("yanlis-sifre", hashed) is False


def test_passwords_over_bcrypt_byte_limit_are_rejected():
    try:
        hash_password("a" * 73)
    except ValueError as error:
        assert str(error) == "PASSWORD_TOO_LONG"
    else:
        raise AssertionError("bcrypt passwords over 72 bytes must be rejected")
