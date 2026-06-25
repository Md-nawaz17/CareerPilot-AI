class UserProfile:
    def __init__(self, name: str, email: str, plan: str = 'free'):
        self.name = name
        self.email = email
        self.plan = plan

    def dict(self):
        return {'name': self.name, 'email': self.email, 'plan': self.plan}


def get_profile():
    return UserProfile(name='Ava Chen', email='ava@example.com')
